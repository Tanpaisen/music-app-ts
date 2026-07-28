// src/services/meilisearch.service.ts
import { MeiliSearch } from 'meilisearch';
import Song from '../models/song.model';

// Hàm lấy client an toàn 
export const getMeiliClient = () => {
  const host = process.env.MEILI_HOST || 'http://localhost:7700';
  const apiKey = process.env.MEILI_ADMIN_KEY || '12345678'; 

  return new MeiliSearch({ host, apiKey });
};

// Hàm lấy Index
export const getSongIndex = () => {
  const client = getMeiliClient();
  return client.index('songs');
};

export const syncSongsToMeili = async () => {
  try {
    const songIndex = getSongIndex();

    // 1. Setup cấu hình
    // Cho phép sai sót chính tả đối với cả từ ngắn (3-4 ký tự)
    await songIndex.updateTypoTolerance({ minWordSizeForTypos: { oneTypo: 3, twoTypos: 7 } });
    await songIndex.updateFilterableAttributes(['deleted', 'status']);
    await songIndex.updateSearchableAttributes(['title', 'fullName', 'slug']);

    // 2. Lấy dữ liệu MongoDB
    const songs = await Song.find({
      deleted: false, 
      status: 'active'
    }).populate('singerId');

    // 3. Chuẩn hóa format
    const documents = songs.map((song: any) => ({
      id: song._id.toString(),
      title: song.title,
      slug: song.slug,
      status: song.status,
      deleted: song.deleted,
      fullName: song.singerId?.fullName || '',
      avatar: song.avatar,
    }));

    // 4. Push lên Meilisearch
    await songIndex.addDocuments(documents);
    console.log('✅ [Meilisearch] Đồng bộ dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi sync Meilisearch:', error);
  }
};