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
  price: null,
  stock: null,
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
        value: item.id,
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
    const res = await getAdminProductList(query)
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
  form.price = null
  form.stock = null
  form.categoryId = ''
  form.mainImage = ''
  form.imageList = []
  form.status = 'ON_SHELF'
  galleryFileList.value = []
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
  form.price = row.price
  form.stock = row.stock
  form.categoryId = row.categoryId
  form.mainImage = row.mainImage
  form.imageList = row.imageList || row.images || []
  form.status = row.status || 'ON_SHELF'
  galleryFileList.value = (form.imageList || []).map((url, idx) => ({
    name: `image-${idx}`,
    url,
  }))
  dialogVisible.value = true
}

const handleMainUpload = async ({ file }) => {
  const res = await uploadFile(file)
  form.mainImage = res.fullUrl || res.url
  ElMessage.success('主图上传成功')
}

const handleGalleryUpload = async ({ file }) => {
  const res = await uploadFile(file)
  const url = res.fullUrl || res.url
  form.imageList.push(url)
  galleryFileList.value = [...form.imageList].map((img, idx) => ({ name: `image-${idx}`, url: img }))
}

const handleGalleryRemove = (file) => {
  form.imageList = form.imageList.filter((img) => img !== file.url)
  galleryFileList.value = form.imageList.map((img, idx) => ({ name: `image-${idx}`, url: img }))
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = {
      title: form.title,
      subTitle: form.subTitle,
      description: form.description,
      price: form.price,
      stock: form.stock,
      categoryId: form.categoryId,
      mainImage: form.mainImage,
      imageList: form.imageList,
      status: form.status,
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
    .catch(() => {})
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
    .catch(() => {})
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
            :preview-src-list="[row.mainImage]" hide-on-click-modal />
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
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="query.pageSize"
        :current-page="query.pageNum" @current-change="handlePageChange" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subTitle" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-cascader v-model="form.categoryId" :options="categoryOptions" :props="{ emitPath: false, checkStrictly: true }"
            placeholder="请选择分类" style="width: 260px" />
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px">
            <el-option label="上架" value="ON_SHELF" />
            <el-option label="下架" value="OFF_SHELF" />
          </el-select>
        </el-form-item>
        <el-form-item label="主图" prop="mainImage">
          <el-upload class="cover-uploader" action="#" :show-file-list="false" :http-request="handleMainUpload">
            <img v-if="form.mainImage" :src="form.mainImage" class="cover" />
            <el-icon v-else class="uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
          <div class="upload-tip">推荐 800x800，需先通过上传接口拿到 URL</div>
        </el-form-item>
        <el-form-item label="轮播图">
          <el-upload action="#" list-type="picture-card" :file-list="galleryFileList" :http-request="handleGalleryUpload"
            :on-remove="handleGalleryRemove">
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
  width: 140px;
}

.cover {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border: 1px solid #eee;
  border-radius: 6px;
}

.uploader-icon {
  font-size: 28px;
  color: #909399;
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  margin-top: 6px;
}
</style>
