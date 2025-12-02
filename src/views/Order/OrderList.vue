<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList, cancelOrder, payOrder } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const list = ref([])
const total = ref(0)
const loading = ref(false)
const activeName = ref('') // '' 为全部

const queryParams = ref({
    pageNum: 1,
    pageSize: 10,
    status: ''
})

const statusMap = {
    'WAIT_PAY': '待支付',
    'PAID': '已支付',
    'SHIPPED': '已发货',
    'COMPLETED': '已完成',
    'CANCELED': '已取消'
}

const loadData = async () => {
    loading.value = true
    queryParams.value.status = activeName.value === 'ALL' ? '' : activeName.value

    try {
        const res = await getOrderList(queryParams.value)
        list.value = res.list || []
        total.value = res.total || 0
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

const handleTabClick = () => {
    queryParams.value.pageNum = 1
    loadData()
}

const handlePageChange = (val) => {
    queryParams.value.pageNum = val
    loadData()
}

const goToDetail = (orderId) => {
    router.push(`/orders/${orderId}`)
}

// 取消订单
const handleCancel = (order) => {
    ElMessageBox.prompt('请输入取消原因', '取消订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then(async ({ value }) => {
        await cancelOrder(order.orderId, value || '用户主动取消')
        ElMessage.success('订单已取消')
        loadData()
    }).catch(() => { })
}

// 模拟支付
const handlePay = async (order) => {
    try {
        await payOrder(order.orderId)
        ElMessage.success('支付成功')
        loadData()
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="container order-list-page">
        <div class="header">我的订单</div>

        <el-tabs v-model="activeName" @tab-click="handleTabClick">
            <el-tab-pane label="全部订单" name="" />
            <el-tab-pane label="待支付" name="WAIT_PAY" />
            <el-tab-pane label="待发货" name="PAID" /> <el-tab-pane label="待收货" name="SHIPPED" />
            <el-tab-pane label="已完成" name="COMPLETED" />
        </el-tabs>

        <div v-loading="loading" class="order-content">
            <el-empty v-if="list.length === 0" description="暂无订单" />

            <div v-for="order in list" :key="order.orderId" class="order-card">
                <div class="card-header">
                    <span class="time">{{ order.createTime }}</span>
                    <span class="no">订单号：{{ order.orderNo }}</span>
                    <span class="status">{{ statusMap[order.status] }}</span>
                </div>

                <div class="card-body">
                    <div class="goods-group">
                        <div v-for="(item, idx) in order.items" :key="idx" class="goods-item"
                            @click="goToDetail(order.orderId)">
                            <img :src="item.productImage" />
                            <div class="goods-name" :title="item.productTitle">{{ item.productTitle }}</div>
                        </div>
                    </div>

                    <div class="amount-col">
                        <div class="total">¥ {{ order.totalAmount }}</div>
                    </div>
                    <div class="action-col">
                        <el-button size="small" @click="goToDetail(order.orderId)">查看详情</el-button>

                        <template v-if="order.status === 'WAIT_PAY'">
                            <el-button type="primary" size="small" @click="handlePay(order)">去支付</el-button>
                            <el-button link type="danger" size="small" @click="handleCancel(order)">取消</el-button>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <div class="pagination-box" v-if="total > 0">
            <el-pagination background layout="prev, pager, next" :total="total" :page-size="queryParams.pageSize"
                @current-change="handlePageChange" />
        </div>
    </div>
</template>

<style scoped>
.order-list-page {
    padding: 20px 0;
    background: #fff;
    min-height: 500px;
}

.header {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
}

.order-card {
    border: 1px solid #eee;
    margin-bottom: 20px;
}

.card-header {
    background: #f5f5f5;
    padding: 10px 20px;
    font-size: 13px;
    color: #666;
    display: flex;
    justify-content: space-between;
}

.card-header .no {
    margin-left: 20px;
    flex: 1;
}

.card-header .status {
    color: #e4393c;
    font-weight: bold;
}

.card-body {
    padding: 20px;
    display: flex;
    align-items: center;
}

.goods-group {
    flex: 1;
    display: flex;
    gap: 15px;
    overflow-x: auto;
}

.goods-item {
    width: 80px;
    cursor: pointer;
}

.goods-item img {
    width: 80px;
    height: 80px;
    border: 1px solid #eee;
}

.goods-name {
    font-size: 12px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 5px;
}

.amount-col {
    width: 120px;
    text-align: center;
    font-weight: bold;
    border-left: 1px solid #eee;
    padding: 0 10px;
}

.action-col {
    width: 150px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    border-left: 1px solid #eee;
    padding: 0 10px;
}

.pagination-box {
    text-align: center;
    margin-top: 20px;
}
</style>