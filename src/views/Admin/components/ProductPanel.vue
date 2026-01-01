<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadFile } from '@/api/auth'
import { getAdminProductList, createAdminProduct, updateAdminProduct, deleteAdminProduct, updateAdminProductStatus, getAdminCategoryTree } from '@/api/admin'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const categoryOptions = ref([])
const categoryMap = ref({})
const dialogVisible = ref(false)
const formRef = ref()
const galleryFileList = ref([]) // 用于 Upload 组件显示

// 默认表单数据
const DEFAULT_FORM = {
  id: '', title: '', subTitle: '', description: '',
  price: 0, stock: 0, categoryId: '',
  mainImage: '', imageList: [], status: 'ON_SHELF'
}
const form = reactive({ ...DEFAULT_FORM })
const query = reactive({ title: '', categoryId: '', status: '', pageNum: 1, pageSize: 10 })

// 校验规则
const rules = {
  title: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  mainImage: [{ required: true, message: '请上传主图', trigger: 'change' }]
}

// 1. 分类数据处理 (递归构建 Map 和 Options)
const loadCategories = async () => {
  const raw = await getAdminCategoryTree() || []
  const map = {}; const options = []

  const traverse = (nodes) => nodes.map(n => {
    map[n.id] = n.name
    const node = { label: n.name, value: n.id }
    if (n.children?.length) node.children = traverse(n.children)
    return node
  })
  categoryOptions.value = traverse(raw)
  categoryMap.value = map
}

// 2. 列表加载 (自动清理空参数)
const loadList = async () => {
  loading.value = true
  try {
    const params = { ...query }
    // 移除空字符串，防止后端报错
    for (const key in params) if (params[key] === '') delete params[key]

    const res = await getAdminProductList(params)
    list.value = res.list || []
    total.value = res.total || 0
  } finally { loading.value = false }
}

// 3. 统一搜索/重置/分页
const handleSearch = (reset = false) => {
  if (reset) Object.assign(query, { title: '', categoryId: '', status: '' })
  if (reset || query.pageNum !== 1) query.pageNum = 1
  loadList()
}

// 4. 打开弹窗 (新增/编辑合一)
const openDialog = (row = null) => {
  if (formRef.value) formRef.value.clearValidate()

  if (row) {
    // 编辑：回显数据
    Object.assign(form, row, {
      price: Number(row.price), stock: Number(row.stock),
      imageList: row.imageList ? row.imageList.split(',') : []
    })
    // 回显相册组件
    galleryFileList.value = form.imageList.map((url, i) => ({ name: `img-${i}`, url }))
  } else {
    // 新增：重置数据
    Object.assign(form, DEFAULT_FORM, { imageList: [] })
    galleryFileList.value = []
  }
  dialogVisible.value = true
}

// 5. 图片上传处理
const handleUpload = async ({ file }, type) => {
  try {
    const { url } = await uploadFile(file)
    if (type === 'main') {
      form.mainImage = url
    } else {
      form.imageList.push(url)
      galleryFileList.value.push({ name: file.name, url })
    }
  } catch (e) { console.error(e) }
}
const handleRemoveGallery = (file) => {
  form.imageList = form.imageList.filter(u => u !== file.url)
  galleryFileList.value = galleryFileList.value.filter(f => f.url !== file.url)
}

// 6. 提交保存
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  const payload = { ...form, imageList: [...form.imageList] } // 确保是数组
  try {
    form.id ? await updateAdminProduct(form.id, payload) : await createAdminProduct(payload)
    ElMessage.success(form.id ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadList()
  } catch (e) { console.error(e) }
}

// 7. 状态/删除操作
const handleAction = (row, type) => {
  const isStatus = type === 'status'
  const nextStatus = row.status === 'ON_SHELF' ? 'OFF_SHELF' : 'ON_SHELF'
  const text = isStatus ? (nextStatus === 'ON_SHELF' ? '上架' : '下架') : '删除'

  ElMessageBox.confirm(`确认${text}「${row.title}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      isStatus ? await updateAdminProductStatus(row.id, nextStatus) : await deleteAdminProduct(row.id)
      ElMessage.success('操作成功')
      loadList()
    }).catch(() => { })
}

onMounted(() => { loadCategories(); loadList() })
onActivated(() => { loadCategories(); loadList() })
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <div class="header-left">
        <div class="title">商品管理</div>
        <div class="subtitle">商品全生命周期管理</div>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="openDialog()">新增商品</el-button>
        <el-button @click="loadList">刷新</el-button>
      </div>
    </div>

    <el-form inline class="filter-bar">
      <el-form-item label="标题">
        <el-input v-model="query.title" placeholder="关键词" clearable @keyup.enter="handleSearch()"
          style="width: 160px" />
      </el-form-item>
      <el-form-item label="分类">
        <el-cascader v-model="query.categoryId" :options="categoryOptions"
          :props="{ emitPath: false, checkStrictly: true }" clearable placeholder="全部分类" style="width: 180px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px" @change="handleSearch()">
          <el-option label="上架" value="ON_SHELF" />
          <el-option label="下架" value="OFF_SHELF" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch()">查询</el-button>
        <el-button @click="handleSearch(true)">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" v-loading="loading" class="custom-table">
      <el-table-column label="主图" width="90" align="center">
        <template #default="{ row }">
          <el-image :src="row.mainImage" fit="cover" class="table-thumb" :preview-src-list="[row.mainImage]"
            preview-teleported />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column label="分类" width="120">
        <template #default="{ row }">{{ categoryMap[row.categoryId] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="120">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ON_SHELF' ? 'success' : 'info'" effect="plain">
            {{ row.status === 'ON_SHELF' ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button link type="warning" size="small" @click="handleAction(row, 'status')">
            {{ row.status === 'ON_SHELF' ? '下架' : '上架' }}
          </el-button>
          <el-button link type="danger" size="small" @click="handleAction(row, 'delete')">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager-wrapper">
      <el-pagination background layout="total, prev, pager, next" :total="Number(total)" :page-size="query.pageSize"
        v-model:current-page="query.pageNum" @current-change="loadList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="700px" destroy-on-close
      :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="24"><el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="60"
                show-word-limit /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="副标题"><el-input v-model="form.subTitle"
                maxlength="120" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-cascader v-model="form.categoryId" :options="categoryOptions"
                :props="{ emitPath: false, checkStrictly: true }" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="状态"><el-select v-model="form.status" style="width: 100%"><el-option
                  label="上架" value="ON_SHELF" /><el-option label="下架"
                  value="OFF_SHELF" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="价格" prop="price"><el-input-number v-model="form.price" :min="0"
                :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="库存" prop="stock"><el-input-number v-model="form.stock" :min="0"
                :precision="0" style="width: 100%" /></el-form-item></el-col>
        </el-row>

        <el-form-item label="主图" prop="mainImage">
          <el-upload class="cover-uploader" action="#" :show-file-list="false"
            :http-request="(opt) => handleUpload(opt, 'main')" accept="image/*">
            <img v-if="form.mainImage" :src="form.mainImage" class="cover" />
            <el-icon v-else class="uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="相册">
          <el-upload list-type="picture-card" action="#" :file-list="galleryFileList"
            :http-request="(opt) => handleUpload(opt, 'gallery')" :on-remove="handleRemoveGallery" accept="image/*">
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="详情">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品详情描述..." />
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
/* 磨砂玻璃风格 */
.panel-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* 头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* 筛选与分页 */
.filter-bar {
  background: #f8fafc;
  padding: 12px 16px 0;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.pager-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表格优化 */
.custom-table {
  background: transparent !important;
  --el-table-tr-bg-color: transparent;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(241, 245, 249, 0.6) !important;
  color: #475569;
  border-bottom: none;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.table-thumb {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  border: 1px solid #eee;
}

/* 上传组件样式 - 修正版 */
.cover-uploader :deep(.el-upload) {
  width: 100px;
  height: 100px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  /* 关键：使用 flex 布局让内部图标居中，且撑满整个区域 */
  display: flex;
  justify-content: center;
  align-items: center;
  transition: .2s;
  /* 确保背景色正确，避免透底 */
  background-color: #fff;
}

/* 悬停变色效果也要给到内部元素 */
.cover-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.uploader-icon {
  font-size: 24px;
  color: #8c939d;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 按钮微调 */
:deep(.el-button--primary:not(.is-link)) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}
</style>