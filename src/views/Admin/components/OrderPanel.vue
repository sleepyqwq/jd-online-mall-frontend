<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminOrderList, getAdminOrderDetail, updateAdminOrderStatus } from '@/api/admin'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const detailVisible = ref(false)
const orderDetail = ref({})

const query = reactive({ orderNo: '', status: '', userId: '', pageNum: 1, pageSize: 10 })

// 统一状态配置 (文案、颜色、操作提示)
const STATUS_MAP = {
  WAIT_PAY: { label: '待支付', type: 'warning' },
  PAID: { label: '已支付', type: 'success', action: 'SHIPPED', actionText: '发货', confirm: '确认标记为已发货？' },
  SHIPPED: { label: '已发货', type: 'primary', action: 'COMPLETED', actionText: '完成', confirm: '确认标记为已完成？' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELED: { label: '已取消', type: 'info' }
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await getAdminOrderList(query)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

// 统一查询入口
const handleSearch = (reset = false) => {
  if (reset) Object.assign(query, { orderNo: '', status: '', userId: '' })
  query.pageNum = 1
  loadList()
}

// 详情查看
const showDetail = async (id) => {
  try {
    orderDetail.value = (await getAdminOrderDetail(id)) || {}
    detailVisible.value = true
  } catch (e) { console.error(e) }
}

// 状态更新
const handleUpdateStatus = (order, targetStatus, tip) => {
  ElMessageBox.confirm(tip, '提示', { type: 'warning' })
    .then(async () => {
      await updateAdminOrderStatus(order.orderId, targetStatus)
      ElMessage.success('操作成功')
      loadList()
      // 如果详情页开着，顺便刷新详情
      if (detailVisible.value && orderDetail.value.orderId === order.orderId) showDetail(order.orderId)
    }).catch(() => { })
}

onMounted(loadList)
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <div class="header-left">
        <div class="title">订单管理</div>
        <div class="subtitle">订单全生命周期监控与处理</div>
      </div>
      <el-button @click="loadList">刷新数据</el-button>
    </div>

    <el-form inline class="filter-bar">
      <el-form-item label="订单号">
        <el-input v-model="query.orderNo" placeholder="模糊搜索" clearable @keyup.enter="handleSearch()"
          style="width: 180px" />
      </el-form-item>
      <el-form-item label="用户ID">
        <el-input v-model="query.userId" placeholder="精准匹配" clearable @keyup.enter="handleSearch()"
          style="width: 150px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="handleSearch()">
          <el-option v-for="(cfg, key) in STATUS_MAP" :key="key" :label="cfg.label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch()">查询</el-button>
        <el-button @click="handleSearch(true)">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" v-loading="loading" class="custom-table">
      <el-table-column label="订单号" min-width="180">
        <template #default="{ row }">
          <span class="link-text" @click="showDetail(row.orderId)">{{ row.orderNo }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="用户ID" width="120" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="STATUS_MAP[row.status]?.type" size="small" effect="plain">
            {{ STATUS_MAP[row.status]?.label || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" width="120">
        <template #default="{ row }">¥ {{ row.totalAmount }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="170" />

      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="showDetail(row.orderId)">详情</el-button>

          <el-button v-if="STATUS_MAP[row.status]?.action" link type="success" size="small"
            @click="handleUpdateStatus(row, STATUS_MAP[row.status].action, STATUS_MAP[row.status].confirm)">
            {{ STATUS_MAP[row.status].actionText }}
          </el-button>

          <el-button v-if="['WAIT_PAY', 'PAID'].includes(row.status)" link type="danger" size="small"
            @click="handleUpdateStatus(row, 'CANCELED', '确认强行关闭此订单？')">
            关闭
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager-wrapper">
      <el-pagination background layout="total, prev, pager, next" :total="Number(total)" :page-size="query.pageSize"
        v-model:current-page="query.pageNum" @current-change="loadList" />
    </div>

    <el-drawer v-model="detailVisible" title="订单详情" size="600px">
      <el-descriptions :column="2" border class="desc-box">
        <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ STATUS_MAP[orderDetail.status]?.label }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥ {{ orderDetail.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ orderDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ orderDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">收货信息</div>
      <div class="info-block" v-if="orderDetail.addressSnapshot">
        <p><strong>{{ orderDetail.addressSnapshot.receiverName }}</strong> ({{ orderDetail.addressSnapshot.receiverPhone
        }})
        </p>
        <p class="sub-text">{{ orderDetail.addressSnapshot.province }} {{ orderDetail.addressSnapshot.city }} {{
          orderDetail.addressSnapshot.detailAddress }}</p>
      </div>

      <div class="section-title">商品清单</div>
      <div class="goods-list">
        <div v-for="item in orderDetail.items" :key="item.id" class="goods-item">
          <img :src="item.productImage" />
          <div class="goods-detail">
            <div class="g-name">{{ item.productTitle }}</div>
            <div class="g-meta">¥{{ item.price }} x {{ item.quantity }}</div>
          </div>
          <div class="g-total">¥{{ item.subtotalAmount }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
/* 核心容器：磨砂玻璃风格 */
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

.link-text {
  color: #3b82f6;
  cursor: pointer;
  font-weight: 500;
}

.link-text:hover {
  text-decoration: underline;
}

/* 详情页样式 */
.section-title {
  font-weight: 700;
  margin: 24px 0 12px;
  border-left: 4px solid #3b82f6;
  padding-left: 10px;
  font-size: 15px;
}

.info-block {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.6;
  font-size: 14px;
}

.sub-text {
  color: #64748b;
  font-size: 13px;
}

/* 商品列表简洁版 */
.goods-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
}

.goods-item img {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  border: 1px solid #eee;
  margin-right: 12px;
  object-fit: cover;
}

.goods-detail {
  flex: 1;
}

.g-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.g-meta {
  color: #999;
  font-size: 12px;
}

.g-total {
  font-weight: 600;
  font-family: Arial;
}

/* 按钮微调 */
:deep(.el-button--primary:not(.is-link)) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}
</style>