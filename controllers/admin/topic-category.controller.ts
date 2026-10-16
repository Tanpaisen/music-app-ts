import type { Request, Response } from "express";
import mongoose from "mongoose";
import Topic from "../../models/topic.model";
import TopicCategory from "../../models/topic-category.model";
import { ensureTopicCategories, listCategories } from "../../services/topic-category.service";
import { systemConfig } from "../../config/system";

const base = `/${systemConfig.prefixAdmin}/topic-categories`;
const VALID_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const normalize = (val: unknown) => typeof val === "string" ? val.trim() : "";
const orderOf = (val: unknown) => Math.max(0, Math.min(9999, Math.floor(Number(val) || 0)));

function fields(req: Request) {
  return {
    label: normalize(req.body?.label).slice(0, 120),
    description: normalize(req.body?.description).slice(0, 500),
    coverImage: normalize(req.body?.coverImage).slice(0, 1000),
    sortOrder: orderOf(req.body?.sortOrder),
    status: req.body?.status === "inactive" ? "inactive" as const : "active" as const,
  };
}

export const index = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await listCategories();
    const counts = await Topic.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: { $ifNull: ["$categoryKey", "khac"] }, count: { $sum: 1 } } },
    ]);
    const counter: Record<string, number> = {};
    for (const row of counts) counter[String(row._id)] = row.count;
    res.render("admin/pages/topic-categories/index", { pageTitle: "Quản lý danh mục chủ đề", categories, counter });
  } catch (err) { console.error("[topic-categories/index]", err); res.status(500).send("Không thể tải danh mục"); }
};

export const create = async (_req: Request, res: Response): Promise<void> => {
  res.render("admin/pages/topic-categories/form", { pageTitle: "Thêm danh mục chủ đề", category: null,
    action: `${base}/create`, method: "POST" });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureTopicCategories();
    const key = normalize(req.body?.key).toLowerCase();
    const value = fields(req);
    if (!VALID_KEY.test(key) || key.length > 80 || !value.label) {
      res.status(400).send("Mã chỉ gồm a-z, 0-9, dấu gạch ngang và tên không được trống."); return;
    }
    if (await TopicCategory.exists({ key })) { res.status(409).send("Mã danh mục đã tồn tại."); return; }
    await TopicCategory.create({ key, ...value, deleted: false });
    res.redirect(base);
  } catch (err) { console.error("[topic-categories/create]", err); res.status(500).send("Không thể thêm danh mục"); }
};

export const edit = async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).send("Không tìm thấy danh mục"); return; }
  const category = await TopicCategory.findOne({ _id: req.params.id, deleted: false }).lean();
  if (!category) { res.status(404).send("Không tìm thấy danh mục"); return; }
  res.render("admin/pages/topic-categories/form", { pageTitle: "Sửa danh mục chủ đề", category,
    action: `${base}/edit/${category._id}?_method=PATCH`, method: "POST" });
};

export const editPatch = async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).send("Không tìm thấy danh mục"); return; }
  try {
    const category = await TopicCategory.findOne({ _id: req.params.id, deleted: false });
    if (!category) { res.status(404).send("Không tìm thấy danh mục"); return; }
    const value = fields(req);
    if (!value.label) { res.status(400).send("Tên danh mục không được trống."); return; }
    if (category.key === "khac" && value.status === "inactive") { res.status(400).send("Không thể ẩn nhóm mặc định."); return; }
    if (value.status === "inactive" && category.status === "active") {
      const count = await Topic.countDocuments({ categoryKey: category.key, deleted: false });
      if (count > 0) { res.status(409).send("Danh mục còn chủ đề. Hãy chuyển chủ đề sang nhóm khác trước khi ẩn."); return; }
    }
    // Mã nhóm cố định sau khi tạo, để Topic.categoryKey không bị đứt liên kết.
    await TopicCategory.updateOne({ _id: category._id }, { $set: value });
    res.redirect(base);
  } catch (err) { console.error("[topic-categories/edit]", err); res.status(500).send("Không thể sửa danh mục"); }
};

export const deleteOne = async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).send("Không tìm thấy danh mục"); return; }
  try {
    const category = await TopicCategory.findOne({ _id: req.params.id, deleted: false });
    if (!category) { res.status(404).send("Không tìm thấy danh mục"); return; }
    if (category.key === "khac") { res.status(400).send("Không thể xóa danh mục mặc định."); return; }
    const count = await Topic.countDocuments({ deleted: false, categoryKey: category.key });
    if (count > 0) { res.status(409).send("Danh mục đang chứa chủ đề. Hãy chuyển chủ đề sang danh mục khác trước khi xóa."); return; }
    await TopicCategory.updateOne({ _id: category._id }, { $set: { deleted: true } });
    res.redirect(base);
  } catch (err) { console.error("[topic-categories/delete]", err); res.status(500).send("Không thể xóa danh mục"); }
};
