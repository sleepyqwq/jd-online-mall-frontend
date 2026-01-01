<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminCategoryTree, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '@/api/admin'

const treeData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()

const form = reactive({ id: '', name: '', parentId: 0, sortOrder: 1 })
const dialogTitle = computed(() => (form.id ? '编辑分类' : '新增分类'))
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

const loadTree = async () => {
  loading.value = true
  try {
    treeData.value = (await getAdminCategoryTree()) || []
  } finally {
    loading.value = false
  }
}

// 统一处理打开弹窗（新增/编辑）
const openDialog = (type, data = null) => {
  // 重置表单
  Object.assign(form, { id: '', name: '', parentId: 0, sortOrder: 1 })

  if (type === 'edit') {
    // 编辑模式
    Object.assign(form, {
      id: data.id,
      name: data.name,
      parentId: data.parentId === '0' ? 0 : data.parentId, // 兼容后端字符串0
      sortOrder: data.sortOrder
    })
  } else if (type === 'add-sub') {
    // 新增子类模式
    if (String(data.parentId) !== '0') return ElMessage.warning('仅支持两级分类')
    form.parentId = data.id
  }
  // type === 'add' (新增一级) 时保持默认值即可

  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  try {
    const payload = { ...form, parentId: form.parentId || 0 } // 确保 parentId 有值
    if (form.id) {
      await updateAdminCategory(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createAdminCategory(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadTree()
  } catch (e) { console.error(e) }
}

const handleDelete = (node) => {
  ElMessageBox.confirm(`确认删除「${node.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteAdminCategory(node.id)
      ElMessage.success('删除成功')
      loadTree()
    }).catch(() => { })
}

onMounted(loadTree)
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <div class="header-left">
        <div class="title">分类管理</div>
        <div class="subtitle">两级分类结构 · 支持拖拽排序</div>
      </div>
      <el-button type="primary" @click="openDialog('add')">新增一级分类</el-button>
    </div>

    <div class="tip-bar">温馨提示：仅支持「一级-二级」结构，二级分类下不可再新增子类。</div>

    <el-skeleton v-if="loading" animated :rows="4" />

    <div v-else class="tree-wrapper">
      <el-tree :data="treeData" node-key="id" default-expand-all :expand-on-click-node="false">
        <template #default="{ data }">
          <div class="custom-tree-node">
            <span class="node-name">{{ data.name }}</span>
            <div class="node-meta">
              <el-tag size="small" type="info" effect="plain">排序: {{ data.sortOrder }}</el-tag>
              <div class="actions">
                <el-button v-if="data.parentId === '0'" link type="primary" size="small"
                  @click="openDialog('add-sub', data)">新增子类</el-button>
                <el-button link type="primary" size="small" @click="openDialog('edit', data)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(data)">删除</el-button>
              </div>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" destroy-on-close align-center>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="上级">
          <el-select v-model="form.parentId" placeholder="选择上级分类" style="width: 100%">
            <el-option label="一级分类 (根节点)" :value="0" />
            <el-option v-for="item in treeData" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="1" controls-position="right" style="width: 100%" />
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
/* 卡片容器：保留磨砂质感 */
.panel-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* 头部样式 */
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
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.tip-bar {
  background: #f1f5f9;
  color: #64748b;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  border-left: 4px solid #cbd5e1;
}

/* 树形列表美化：模拟表格行效果 */
.tree-wrapper {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  padding: 8px;
}

:deep(.el-tree-node__content) {
  height: 48px;
  /* 增加行高 */
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f8fafc;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-name {
  font-weight: 600;
  color: #334155;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 按钮样式优化 */
:deep(.el-button--primary:not(.is-link)) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
  transition: transform 0.2s;
}

:deep(.el-button--primary:not(.is-link):hover) {
  transform: translateY(-2px);
}

/* 操作区文字按钮 */
.actions .el-button {
  margin-left: 0;
  padding: 4px 8px;
  border-radius: 4px;
}

.actions .el-button:hover {
  background: rgba(0, 0, 0, 0.04);
}
</style>