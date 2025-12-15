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
  form.parentId = 0 // 使用数字 0 代表根节点，匹配后端 Long 类型
  form.sortOrder = 1
}

const openCreate = (parent) => {
  resetForm()
  if (parent) {
    // 仅允许两级分类
    // 后端 ParentId 为 0 或 null 代表一级，前端数据中 parentId 可能是字符串 "0"
    if (String(parent.parentId) !== '0') {
      ElMessage.warning('仅支持两级分类，二级分类下不可再新增')
      return
    }
    form.parentId = parent.id
  } else {
    form.parentId = 0 // 新增一级分类
  }
  dialogVisible.value = true
}

const openEdit = (node) => {
  form.id = node.id
  form.name = node.name
  // 后端返回的 id 和 parentId 都是 String (因 JacksonConfig 配置)
  // 编辑时可以直接使用字符串 ID，但在 Select 选择器中需要注意类型匹配
  // 这里为了配合下面的 Select 选项，如果是 "0" 则转为数字 0，或者让 Select 兼容字符串
  form.parentId = node.parentId === '0' ? 0 : node.parentId
  form.sortOrder = node.sortOrder
  dialogVisible.value = true
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = {
      name: form.name,
      parentId: form.parentId === '' ? 0 : form.parentId,
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
    .catch(() => { })
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
  color: #f4f4f4 !important;
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
