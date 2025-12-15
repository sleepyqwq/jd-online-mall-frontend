<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadFile } from '@/api/auth'
import {
  getAdminProductList,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  updateAdminProductStatus,
  getAdminCategoryTree,
} from '@/api/admin'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  title: '',
  categoryId: '',
  status: '',
  pageNum: 1,
  pageSize: 10,
})

const categoryOptions = ref([])
const categoryMap = ref({})

const dialogVisible = ref(false)
const formRef = ref()

const form = reactive({
  id: '',
  title: '',
  subTitle: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: '',
  mainImage: '',
  imageList: [],
  status: 'ON_SHELF',
})

const galleryFileList = ref([])

const statusDict = {
  ON_SHELF: '上架',
  OFF_SHELF: '下架',
}

const rules = {
  title: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  mainImage: [{ required: true, message: '请上传主图', trigger: 'change' }],
}

const buildCategoryOptions = (tree = []) => {
  const flat = {}
  const mapper = (nodes) =>
    nodes.map((item) => {
      flat[item.id] = item.name
      return {
        label: item.name,
        value: item.id, // 后端返回的是 String 类型的 ID，这里直接用
        children: item.children?.map((child) => {
          flat[child.id] = child.name
          return { label: child.name, value: child.id }
        }),
      }
    })
  categoryMap.value = flat
  return mapper(tree)
}

const loadCategories = async () => {
  try {
    const res = await getAdminCategoryTree()
    categoryOptions.value = buildCategoryOptions(res || [])
  } catch (error) {
    console.error(error)
  }
}

const loadList = async () => {
  loading.value = true
  try {
    // 【关键修正】清理空字符串参数，避免后端 Long 类型报错
    const params = {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      title: query.title || undefined,
      status: query.status || undefined,
      categoryId: query.categoryId || undefined // 清理空串
    }
    const res = await getAdminProductList(params)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.id = ''
  form.title = ''
  form.subTitle = ''
  form.description = ''
  form.price = 0
  form.stock = 0
  form.categoryId = ''
  form.mainImage = ''
  form.imageList = []
  form.status = 'ON_SHELF'
  galleryFileList.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  resetForm()
  form.id = row.id
  form.title = row.title
  form.subTitle = row.subTitle
  form.description = row.description
  form.price = Number(row.price)
  form.stock = Number(row.stock)
  form.categoryId = row.categoryId
  form.mainImage = row.mainImage
  form.status = row.status || 'ON_SHELF'

  // 处理图片列表回显
  // 后端 List<String> 序列化后就是 JS Array
  const images = row.imageList || row.images || []
  form.imageList = [...images]

  // 构造 Upload 组件需要的 fileList
  galleryFileList.value = form.imageList.map((url, idx) => ({
    name: `image-${idx}`,
    url: url,
  }))

  dialogVisible.value = true
}

const handleMainUpload = async ({ file }) => {
  try {
    const res = await uploadFile(file)
    // 【关键修正】仅保存相对路径 url，配合 Vite 代理显示
    form.mainImage = res.url
    ElMessage.success('主图上传成功')
  } catch (error) {
    // error
  }
}

const handleGalleryUpload = async ({ file }) => {
  try {
    const res = await uploadFile(file)
    const url = res.url // 【关键修正】仅保存相对路径

    form.imageList.push(url)

    galleryFileList.value.push({
      name: file.name,
      url: url
    })
    ElMessage.success('上传成功')
  } catch (error) {
    console.error(error)
  }
}

const handleGalleryRemove = (uploadFile) => {
  const urlToRemove = uploadFile.url
  form.imageList = form.imageList.filter((img) => img !== urlToRemove)
  // 同步更新显示列表
  galleryFileList.value = galleryFileList.value.filter(f => f.url !== urlToRemove)
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return

    // 构造提交参数
    const payload = {
      ...form,
      price: Number(form.price), // 确保数字类型
      stock: Number(form.stock), // 确保数字类型
      imageList: [...form.imageList] // 确保是数组
    }

    try {
      if (form.id) {
        await updateAdminProduct(form.id, payload)
        ElMessage.success('商品已更新')
      } else {
        await createAdminProduct(payload)
        ElMessage.success('商品创建成功')
      }
      dialogVisible.value = false
      loadList()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteAdminProduct(row.id)
      ElMessage.success('删除成功')
      loadList()
    })
    .catch(() => { })
}

const handleToggleStatus = (row) => {
  const nextStatus = row.status === 'ON_SHELF' ? 'OFF_SHELF' : 'ON_SHELF'
  const tip = nextStatus === 'ON_SHELF' ? '上架' : '下架'
  ElMessageBox.confirm(`确认要${tip}该商品吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await updateAdminProductStatus(row.id, nextStatus)
      ElMessage.success(`${tip}成功`)
      loadList()
    })
    .catch(() => { })
}

const handleSearch = () => {
  query.pageNum = 1
  loadList()
}

const handleReset = () => {
  query.title = ''
  query.categoryId = ''
  query.status = ''
  query.pageNum = 1
  loadList()
}

const handlePageChange = (page) => {
  query.pageNum = page
  loadList()
}

onMounted(() => {
  loadCategories()
  loadList()
})
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <div>
        <div class="panel-title">商品管理</div>
        <div class="panel-subtitle">支持商品查询、上下架、编辑与新增</div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openCreate">新增商品</el-button>
        <el-button @click="loadList">刷新</el-button>
      </div>
    </div>

    <el-form inline class="filter-bar" label-width="80px">
      <el-form-item label="关键字">
        <el-input v-model="query.title" placeholder="商品标题关键词" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="分类">
        <el-cascader v-model="query.categoryId" :options="categoryOptions" clearable filterable placeholder="全部分类"
          :props="{ emitPath: false, checkStrictly: true }" style="width: 220px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
          <el-option label="上架" value="ON_SHELF" />
          <el-option label="下架" value="OFF_SHELF" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column label="主图" width="100" align="center">
        <template #default="{ row }">
          <el-image v-if="row.mainImage" :src="row.mainImage" fit="cover" style="width: 60px; height: 60px"
            :preview-src-list="[row.mainImage]" hide-on-click-modal preview-teleported />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="商品标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="分类" min-width="120">
        <template #default="{ row }">
          {{ categoryMap[row.categoryId] || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格(元)" width="110" />
      <el-table-column prop="stock" label="库存" width="90" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ON_SHELF' ? 'success' : 'info'">
            {{ statusDict[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button text type="warning" size="small" @click="handleToggleStatus(row)">
            {{ row.status === 'ON_SHELF' ? '下架' : '上架' }}
          </el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="Number(total)" :page-size="query.pageSize"
        v-model:current-page="query.pageNum" @current-change="handlePageChange" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="720px" destroy-on-close
      :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subTitle" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-cascader v-model="form.categoryId" :options="categoryOptions"
            :props="{ emitPath: false, checkStrictly: true }" placeholder="请选择分类" style="width: 100%" />
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 180px" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" :precision="0" style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px">
            <el-option label="上架" value="ON_SHELF" />
            <el-option label="下架" value="OFF_SHELF" />
          </el-select>
        </el-form-item>

        <el-form-item label="主图" prop="mainImage">
          <el-upload class="cover-uploader" action="#" :show-file-list="false" :http-request="handleMainUpload"
            accept="image/*">
            <img v-if="form.mainImage" :src="form.mainImage" class="cover" />
            <el-icon v-else class="uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
          <div class="upload-tip">点击上传图片，建议尺寸 800x800</div>
        </el-form-item>

        <el-form-item label="轮播图">
          <el-upload action="#" list-type="picture-card" :file-list="galleryFileList"
            :http-request="handleGalleryUpload" :on-remove="handleGalleryRemove" accept="image/*">
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="详情描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="支持富文本字符串" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.panel-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
}

.panel-subtitle {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  background: #f7f9fc;
  padding: 12px 12px 4px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.pager {
  margin-top: 16px;
  text-align: right;
}

.cover-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 6px;
}

/* 1. 卡片容器：半透明磨砂质感 */
.panel-card {
  /* 0.95 不透明度，既保证内容可读性，又有一点通透感 */
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(20px);
  /* 磨砂效果 */
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px !important;
  padding: 30px 35px !important;
  /* 柔和的光晕阴影 */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: transform 0.3s ease;
}

/* 2. 头部标题 */
.panel-title {
  font-size: 24px !important;
  font-weight: 800 !important;
  /* 渐变文字 */
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.panel-subtitle {
  color: #64748b !important;
  font-size: 13px !important;
  margin-top: 8px !important;
}

/* 3. 筛选栏 */
.filter-bar {
  background: rgba(248, 250, 252, 0.6) !important;
  /* 更淡的背景 */
  padding: 18px 24px 6px !important;
  border-radius: 12px !important;
  border: 1px solid rgba(226, 232, 240, 0.6) !important;
}

/* 4. Element Plus 表格美化 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  /* 表格背景透明，透出卡片背景 */
  background-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: rgba(241, 245, 249, 0.5) !important;
  /* 半透明表头 */
  color: #475569;
  font-weight: 700;
  height: 50px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: rgba(241, 245, 249, 0.8) !important;
}

/* 5. 按钮美化 (重点修正) */

/* 主要操作按钮 (新增商品等) */
:deep(.el-button--primary) {
  /* 更加时尚的蓝紫渐变 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
  font-weight: 500;
  padding: 10px 20px;
  height: auto;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(118, 75, 162, 0.4);
}

/* 文本操作按钮 (表格内的编辑/删除) */
/* 统一先给 text 按钮加一点内边距 */
:deep(.el-button.is-text) {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

/* 编辑按钮 - 改为柔和的蓝色背景块 */
:deep(.el-button--primary.is-text) {
  background-color: rgba(58, 123, 213, 0.1);
  color: #ffffff !important;
}

:deep(.el-button--primary.is-text:hover) {
  background-color: rgba(58, 123, 213, 0.2);
}

/* 下架/上架按钮 - 橙色背景块 */
:deep(.el-button--warning.is-text) {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b !important;
}

:deep(.el-button--warning.is-text:hover) {
  background-color: rgba(245, 158, 11, 0.2);
}

/* 删除按钮 - 红色背景块 */
:deep(.el-button--danger.is-text) {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444 !important;
}

:deep(.el-button--danger.is-text:hover) {
  background-color: rgba(239, 68, 68, 0.2);
}

/* 标签美化 */
:deep(.el-tag) {
  border-radius: 6px;
  padding: 0 12px;
  font-weight: 600;
  border: none;
  letter-spacing: 0.5px;
}

/* 上架状态 */
:deep(.el-tag--success) {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

/* 下架状态 */
:deep(.el-tag--info) {
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}
</style>