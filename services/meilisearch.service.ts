import { MeiliSearch } from 'meilisearch';
import Song from '../models/song.model';

export const getMeiliClient = () => {
  const host = (process.env.MEILI_HOST || 'http://localhost:7700').trim();
  const apiKey = process.env.MEILI_ADMIN_KEY?.trim();
  return new MeiliSearch({ host, apiKey });
};

export const getSongIndex = () => getMeiliClient().index('songs');

// Thử lại khi Render trả 502/503 (server đang ngủ hoặc khởi động lại)
const withRetry = async <T>(label: string, fn: () => Promise<T>, tries = 6): Promise<T> => {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (i >= tries) throw e;
      console.log(`⏳ [Meilisearch] ${label}: ${e?.message} - thử lại ${i}/${tries - 1} sau 10s...`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
};

export const syncSongsToMeili = async () => {
  let step = 'bắt đầu';
  try {
    const client = getMeiliClient();
    const songIndex = getSongIndex();
    console.log('[Meilisearch] host =', process.env.MEILI_HOST);

    // Kiểm tra server sống trước
    step = 'health';
    await withRetry('health', () => client.health());

    step = 'createIndex';
    console.log('1. tạo index (nếu chưa có)...');
    const createTask = await withRetry('createIndex', () =>
      client.createIndex('songs', { primaryKey: 'id' })
    );
    await withRetry('waitCreate', () => client.waitForTask(createTask.taskUid, { timeOutMs: 60000 }));
    // Nếu index đã tồn tại thì task này fail -> bỏ qua, bước 2 sẽ ép lại primaryKey

    step = 'updateIndex';
    console.log('2. ép primaryKey = id...');
    const pkTask = await withRetry('updateIndex', () =>
      client.updateIndex('songs', { primaryKey: 'id' })
    );
    const pkDone = await withRetry('waitPk', () => client.waitForTask(pkTask.taskUid, { timeOutMs: 60000 }));
    if (pkDone.status !== 'succeeded') console.warn('⚠️ updateIndex:', pkDone.error?.message);

    step = 'settings';
    console.log('3. cập nhật settings...');
    const settingsTasks = await withRetry('settings', () =>
      Promise.all([
        songIndex.updateTypoTolerance({ minWordSizeForTypos: { oneTypo: 3, twoTypos: 7 } }),
        songIndex.updateFilterableAttributes(['deleted', 'status']),
        songIndex.updateSearchableAttributes(['title', 'fullName', 'slug']),
      ])
    );
    await withRetry('waitSettings', () =>
      songIndex.waitForTasks(settingsTasks.map((t) => t.taskUid), { timeOutMs: 60000 })
    );

    step = 'mongo';
    console.log('4. lấy dữ liệu MongoDB + thêm documents...');
    const songs = await Song.find({ deleted: false, status: 'active' }).populate('singerId');
    const documents = songs.map((song: any) => ({
      id: song._id.toString(),
      title: song.title,
      slug: song.slug,
      status: song.status,
      deleted: song.deleted,
      avatar: song.avatar ?? '',
      like: song.like ?? 0,
      listen: song.listen ?? 0,
      audio: song.audio ?? null,
      singerId: song.singerId?._id?.toString() ?? null,
      fullName: song.singerId?.fullName ?? '',
    }));

    step = 'addDocuments';
    const clearTask = await withRetry('deleteAll', () => songIndex.deleteAllDocuments());
    await withRetry('waitClear', () => songIndex.waitForTask(clearTask.taskUid, { timeOutMs: 60000 }));

    if (documents.length === 0) {
      console.log('ℹ️ [Meilisearch] Không có dữ liệu bài hát để đồng bộ.');
      return;
    }
    const addTask = await withRetry('addDocuments', () =>
      songIndex.addDocuments(documents, { primaryKey: 'id' })
    );
    const done = await withRetry('waitAdd', () => songIndex.waitForTask(addTask.taskUid, { timeOutMs: 60000 }));
    if (done.status !== 'succeeded') {
      console.error('❌ [Meilisearch] addDocuments THẤT BẠI:', done.error);
      return;
    }
    const stats = await songIndex.getStats();
    console.log(`✅ [Meilisearch] Index hiện có ${stats.numberOfDocuments} bài hát (đã gửi ${documents.length})`);
  } catch (error: any) {
    console.error(`❌ Lỗi sync Meilisearch ở bước "${step}":`, error?.message || error);
    console.error('   code:', error?.code, '| status:', error?.httpStatus ?? error?.cause?.status, '| cause:', error?.cause?.message ?? error?.cause);
  }
};
