<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAdminCategoryTree,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/api/admin'

const treeData = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  id: '',
  name: '',
  parentId: '0',
  sortOrder: 1,
})

const dialogTitle = computed(() => (form.id ? '编辑分类' : '新增分类'))

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

const loadTree = async () => {
  loading.value = true
  try {
    const res = await getAdminCategoryTree()
    treeData.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.id = ''
  form.name = ''
  form.parentId = '0'
  form.sortOrder = 1
}

const openCreate = (parent) => {
  resetForm()
  if (parent) {
    // 仅允许两级分类
    if (parent.parentId !== '0') {
      ElMessage.warning('仅支持两级分类，二级分类下不可再新增')
      return
    }
    form.parentId = parent.id
  }
  dialogVisible.value = true
}

const openEdit = (node) => {
  form.id = node.id
  form.name = node.name
  form.parentId = node.parentId
  form.sortOrder = node.sortOrder
  dialogVisible.value = true
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = {
      name: form.name,
      parentId: form.parentId,
      sortOrder: form.sortOrder,
    }
    try {
      if (form.id) {
        await updateAdminCategory(form.id, payload)
        ElMessage.success('分类已更新')
      } else {
        await createAdminCategory(payload)
        ElMessage.success('分类创建成功')
      }
      dialogVisible.value = false
      loadTree()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleDelete = (node) => {
  ElMessageBox.confirm(`确认删除「${node.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteAdminCategory(node.id)
      ElMessage.success('删除成功')
      loadTree()
    })
    .catch(() => {})
}

onMounted(() => {
  loadTree()
})
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <div>
        <div class="panel-title">分类管理</div>
        <div class="panel-subtitle">两级分类结构，支持排序</div>
      </div>
      <el-button type="primary" @click="openCreate()">新增一级分类</el-button>
    </div>

    <div class="tip">温馨提示：仅支持「一级-二级」两级结构，二级分类下不可再新增子类。</div>

    <el-skeleton v-if="loading" animated :rows="4" />

    <el-tree v-else :data="treeData" node-key="id" default-expand-all highlight-current class="category-tree">
      <template #default="{ data }">
        <div class="tree-node">
          <span class="name">{{ data.name }}</span>
          <el-tag size="small" type="info">排序：{{ data.sortOrder }}</el-tag>
          <div class="node-actions">
            <el-button text size="small" type="primary" @click.stop="openCreate(data)"
              v-if="data.parentId === '0'">新增子类</el-button>
            <el-button text size="small" @click.stop="openEdit(data)">编辑</el-button>
            <el-button text size="small" type="danger" @click.stop="handleDelete(data)">删除</el-button>
          </div>
        </div>
      </template>
    </el-tree>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="上级分类">
          <el-select v-model="form.parentId" style="width: 240px">
            <el-option label="一级分类" value="0" />
            <el-option v-for="root in treeData" :key="root.id" :label="root.name" :value="root.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="1" :max="999" />
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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

.tip {
  background: #f7f9fc;
  padding: 8px 12px;
  border-radius: 6px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 10px;
}

.category-tree {
  background: #fafbff;
  border: 1px solid #eef2f8;
  padding: 12px;
  border-radius: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.name {
  font-weight: 600;
}

.node-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
</style>
