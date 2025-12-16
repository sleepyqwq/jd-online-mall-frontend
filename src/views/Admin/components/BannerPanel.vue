<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { UploadFilled, Plus } from '@element-plus/icons-vue'
  import { uploadFile } from '@/api/auth'
  import {
    getAdminBannerList,
    createAdminBanner,
    updateAdminBanner,
    deleteAdminBanner,
    updateAdminBannerStatus,
  } from '@/api/admin'

  const loading = ref(false)
  const list = ref([])
  const total = ref(0)
  const query = reactive({ pageNum: 1, pageSize: 10 })

  const dialogVisible = ref(false)
  const formRef = ref()
  const form = reactive({
    id: '',
    imgUrl: '',
    redirectUrl: '',
    sortOrder: 1,
    status: 1,
  })

  const rules = {
    imgUrl: [{ required: true, message: '请上传图片', trigger: 'change' }],
    sortOrder: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  }

  // 加载列表
  const loadList = async () => {
    loading.value = true
    try {
      const res = await getAdminBannerList(query)
      list.value = res.list || []
      total.value = res.total || 0
    } finally {
      loading.value = false
    }
  }

  // 图片上传
  const handleUpload = async ({ file }) => {
    try {
      const res = await uploadFile(file)
      form.imgUrl = res.url // 保存相对路径或完整路径均可，取决于后端配置
      ElMessage.success('上传成功')
    } catch (error) {
      // 错误已处理
    }
  }

  // 提交表单
  const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
      if (valid) {
        if (form.id) {
          await updateAdminBanner(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await createAdminBanner(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadList()
      }
    })
  }

  // 打开新增
  const openCreate = () => {
    form.id = ''
    form.imgUrl = ''
    form.redirectUrl = ''
    form.sortOrder = 1
    form.status = 1
    dialogVisible.value = true
  }

  // 打开编辑
  const openEdit = (row) => {
    Object.assign(form, row)
    dialogVisible.value = true
  }

  // 切换状态
  const toggleStatus = async (row) => {
    const newStatus = row.status === 1 ? 0 : 1
    await updateAdminBannerStatus(row.id, newStatus)
    ElMessage.success('状态已更新')
    loadList()
  }

  // 删除
  const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该轮播图吗？', '警告', { type: 'warning' })
      .then(async () => {
        await deleteAdminBanner(row.id)
        ElMessage.success('删除成功')
        loadList()
      })
      .catch(() => {})
  }

  onMounted(() => {
    loadList()
  })
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <div class="panel-title">轮播图管理</div>
      <el-button type="primary" @click="openCreate">新增轮播图</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column label="图片" width="180" align="center">
        <template #default="{ row }">
          <el-image
            :src="row.imgUrl"
            fit="cover"
            style="width: 120px; height: 60px; border-radius: 4px"
            :preview-src-list="[row.imgUrl]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="redirectUrl" label="跳转链接" min-width="150" />
      <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button text type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button text type="warning" @click="toggleStatus(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button text type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑轮播图' : '新增轮播图'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="图片" prop="imgUrl">
          <el-upload
            class="banner-uploader"
            action="#"
            :show-file-list="false"
            :http-request="handleUpload"
            accept="image/*"
          >
            <img v-if="form.imgUrl" :src="form.imgUrl" class="preview-img" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="tip">建议尺寸 1920x440 或同比例图片</div>
        </el-form-item>
        <el-form-item label="跳转链接" prop="redirectUrl">
          <el-input v-model="form.redirectUrl" placeholder="站内如 /products/1，站外需带 http" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
  /* 复用之前的 Panel 样式 */
  .panel-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 30px 35px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .panel-title {
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .banner-uploader {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .banner-uploader:hover {
    border-color: #409eff;
  }
  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }
  .tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
  }
</style>
