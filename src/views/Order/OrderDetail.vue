<script setup>
// 【修正】补充引入 onUnmounted
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail, payOrder, cancelOrder } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const order = ref({})
const loading = ref(true)
const timer = ref(null)
const nowTime = ref(Date.now()) // 响应式当前时间

const statusMap = {
    'WAIT_PAY': '待支付',
    'PAID': '已支付',
    'SHIPPED': '已发货',
    'COMPLETED': '已完成',
    'CANCELED': '已取消'
}

// 加载详情
const loadDetail = async () => {
    loading.value = true
    try {
        const res = await getOrderDetail(route.params.orderId)
        order.value = res || {}
        // 如果订单是待支付状态，启动倒计时
        if (order.value.status === 'WAIT_PAY') {
            startTimer()
        } else {
            stopTimer()
        }
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

// 倒计时逻辑
const remainingSeconds = computed(() => {
    if (!order.value.expireTime) return 0
    // 兼容后端时间格式 'yyyy-MM-dd HH:mm:ss' -> 'yyyy-MM-ddTHH:mm:ss'
    return new Date(order.value.expireTime.replace(' ', 'T')).getTime() - nowTime.value
})

const startTimer = () => {
    stopTimer()
    timer.value = setInterval(() => {
        nowTime.value = Date.now()
        // 如果倒计时结束，清除定时器并刷新页面状态（此时后端可能已取消订单）
        if (remainingSeconds.value <= 0) {
            stopTimer()
            loadDetail()
        }
    }, 1000)
}

const stopTimer = () => {
    if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
    }
}

// 支付
const handlePay = async () => {
    try {
        await payOrder(order.value.orderId)
        ElMessage.success('支付成功')
        loadDetail() // 刷新状态
    } catch (error) {
        // error
    }
}

// 取消
const handleCancel = () => {
    ElMessageBox.prompt('请输入取消原因', '取消订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then(async ({ value }) => {
        await cancelOrder(order.value.orderId, value || '不想要了')
        ElMessage.success('订单已取消')
        loadDetail()
    }).catch(() => { })
}

// 基于 expireTime 和当前时间计算剩余描述
const remainingTime = computed(() => {
    if (order.value.status !== 'WAIT_PAY' || !order.value.expireTime) return ''

    const expireDate = new Date(order.value.expireTime.replace(' ', 'T'))
    const diff = expireDate.getTime() - nowTime.value

    if (diff <= 0) return '00:00'

    const minutes = Math.floor((diff / 1000 / 60) % 60)
    const seconds = Math.floor((diff / 1000) % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

onMounted(() => {
    loadDetail()
})

// 【修正】现在这里可以正常工作了
onUnmounted(() => {
    stopTimer()
})
</script>

<template>
    <div class="container detail-page" v-loading="loading">
        <div class="status-bar">
            <div class="status-text">
                订单状态：<strong>{{ statusMap[order.status] }}</strong>
                <span v-if="order.status === 'WAIT_PAY' && remainingTime" class="time-tip">
                    （剩余支付时间：{{ remainingTime }}）
                </span>
            </div>
            <div class="actions" v-if="order.status === 'WAIT_PAY'">
                <el-button type="primary" @click="handlePay">立即支付</el-button>
                <el-button @click="handleCancel">取消订单</el-button>
            </div>
        </div>

        <div class="section-card">
            <h3>收货人信息</h3>
            <div class="info-row" v-if="order.address">
                <div>收货人：{{ order.address.receiverName }}</div>
                <div>联系电话：{{ order.address.receiverPhone }}</div>
                <div>收货地址：{{ order.address.province }} {{ order.address.city }} {{ order.address.district }} {{
                    order.address.detailAddress }}</div>
            </div>
        </div>

        <div class="section-card">
            <h3>商品清单</h3>
            <el-table :data="order.items" border>
                <el-table-column label="商品信息">
                    <template #default="{ row }">
                        <div class="prod-info">
                            <img :src="row.productImage" />
                            <span>{{ row.productTitle }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="price" label="单价" width="120" />
                <el-table-column prop="quantity" label="数量" width="100" />
                <el-table-column prop="subtotalAmount" label="小计" width="120" />
            </el-table>
            <div class="total-row">
                商品总额：<span class="price">¥ {{ order.totalAmount }}</span>
            </div>
        </div>

        <div class="section-card" v-if="order.orderNo">
            <h3>订单信息</h3>
            <div class="info-row">
                <div>订单编号：{{ order.orderNo }}</div>
                <div>创建时间：{{ order.createTime }}</div>
                <div v-if="order.payTime">支付时间：{{ order.payTime }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.detail-page {
    padding: 20px 0;
}

.status-bar {
    background: #f5f5f5;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid #eee;
}

.status-text strong {
    color: #e4393c;
    font-size: 18px;
}

.time-tip {
    font-size: 12px;
    color: #666;
    margin-left: 10px;
}

.section-card {
    border: 1px solid #eee;
    padding: 20px;
    margin-bottom: 20px;
}

.section-card h3 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
    font-size: 16px;
}

.info-row div {
    margin-bottom: 10px;
    color: #333;
}

.prod-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.prod-info img {
    width: 50px;
    height: 50px;
    border: 1px solid #eee;
}

.total-row {
    text-align: right;
    margin-top: 20px;
    font-size: 14px;
}

.total-row .price {
    color: #e4393c;
    font-size: 20px;
    font-weight: bold;
}
</style>