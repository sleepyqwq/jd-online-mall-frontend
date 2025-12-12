<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminOrderList, getAdminOrderDetail, updateAdminOrderStatus } from '@/api/admin'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({
  orderNo: '',
  status: '',
  userId: '',
  pageNum: 1,
  pageSize: 10,
})

const detailVisible = ref(false)
const orderDetail = ref({})

const statusDict = {
  WAIT_PAY: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELED: '已取消',
}

const statusTagType = {
  WAIT_PAY: 'warning',
  PAID: 'success',
  SHIPPED: 'info',
  COMPLETED: 'success',
  CANCELED: 'danger',
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getAdminOrderList(query)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  loadList()
}

const handleReset = () => {
  query.orderNo = ''
  query.status = ''
  query.userId = ''
  query.pageNum = 1
  loadList()
}

const handlePageChange = (page) => {
  query.pageNum = page
  loadList()
}

const showDetail = async (orderId) => {
  try {
    const res = await getAdminOrderDetail(orderId)
    orderDetail.value = res || {}
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleUpdateStatus = (order, status, remark) => {
  const tips = {
    SHIPPED: '确认标记为已发货吗？',
    COMPLETED: '确认标记为已完成吗？',
    CANCELED: '确认关闭订单吗？',
  }
  ElMessageBox.confirm(tips[status] || '确认更新订单状态？', '提示', { type: 'warning' })
    .then(async () => {
      await updateAdminOrderStatus(order.orderId, status, remark)
      ElMessage.success('订单状态已更新')
      loadList()
      if (detailVisible.value && orderDetail.value.orderId === order.orderId) {
        showDetail(order.orderId)
      }
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
      <div>
        <div class="panel-title">订单管理</div>
        <div class="panel-subtitle">查看订单状态、明细，支持发货/完成/关闭</div>
      </div>
      <el-button @click="loadList">刷新</el-button>
    </div>

    <el-form inline class="filter-bar" label-width="90px">
      <el-form-item label="订单号">
        <el-input v-model="query.orderNo" placeholder="支持模糊搜索" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="用户ID">
        <el-input v-model="query.userId" placeholder="可选" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 160px">
          <el-option label="待支付" value="WAIT_PAY" />
          <el-option label="已支付" value="PAID" />
          <el-option label="已发货" value="SHIPPED" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="已取消" value="CANCELED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column label="订单号" min-width="160">
        <template #default="{ row }">
          <el-link type="primary" @click="showDetail(row.orderId)">{{ row.orderNo }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="用户ID" width="120" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType[row.status] || 'info'">
            {{ statusDict[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="总金额(元)" width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="160" />
      <el-table-column prop="payTime" label="支付时间" min-width="160" />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="showDetail(row.orderId)">详情</el-button>
          <el-button
            v-if="row.status === 'PAID'"
            text
            type="primary"
            size="small"
            @click="handleUpdateStatus(row, 'SHIPPED', '已发货')"
          >
            发货
          </el-button>
          <el-button
            v-if="row.status === 'SHIPPED'"
            text
            type="success"
            size="small"
            @click="handleUpdateStatus(row, 'COMPLETED', '已收货')"
          >
            完成
          </el-button>
          <el-button
            v-if="row.status === 'WAIT_PAY' || row.status === 'PAID'"
            text
            type="danger"
            size="small"
            @click="handleUpdateStatus(row, 'CANCELED', '后台关闭订单')"
          >
            关闭
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="query.pageSize"
        :current-page="query.pageNum" @current-change="handlePageChange" />
    </div>

    <el-drawer v-model="detailVisible" title="订单详情" size="60%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType[orderDetail.status] || 'info'">
            {{ statusDict[orderDetail.status] || orderDetail.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥ {{ orderDetail.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ orderDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ orderDetail.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ orderDetail.cancelTime || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="block-title">收货信息</div>
      <div class="address-box" v-if="orderDetail.address">
        <div>收货人：{{ orderDetail.address.receiverName }}</div>
        <div>联系电话：{{ orderDetail.address.receiverPhone }}</div>
        <div>地址：{{ orderDetail.address.province }} {{ orderDetail.address.city }} {{ orderDetail.address.district }}
          {{ orderDetail.address.detailAddress }}</div>
      </div>

      <div class="block-title">商品清单</div>
      <el-table :data="orderDetail.items || []" border size="small">
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="goods-info">
              <img :src="row.productImage" />
              <div>
                <div class="name">{{ row.productTitle }}</div>
                <div class="meta">ID: {{ row.productId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="subtotalAmount" label="小计" width="100" />
      </el-table>
    </el-drawer>
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

.block-title {
  margin: 18px 0 8px;
  font-weight: 600;
}

.address-box {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #eee;
  line-height: 1.7;
}

.goods-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.goods-info img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 1px solid #eee;
}

.goods-info .name {
  font-weight: 600;
}

.goods-info .meta {
  font-size: 12px;
  color: #999;
}
</style>
