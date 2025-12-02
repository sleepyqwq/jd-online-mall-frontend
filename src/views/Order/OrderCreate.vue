<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAddressList } from '@/api/address'
import { getCartList } from '@/api/cart' // 复用购物车查询
import { createOrder } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const addressList = ref([])
const selectedAddressId = ref('')
const orderItems = ref([])
const remark = ref('')
const loading = ref(true)

// 从 SessionStorage 获取结算商品 ID
const checkoutIds = JSON.parse(sessionStorage.getItem('checkoutItems') || '[]')

// 加载数据
onMounted(async () => {
    if (checkoutIds.length === 0) {
        ElMessage.warning('未选择结算商品')
        router.replace('/cart')
        return
    }

    try {
        // 1. 获取地址
        const addrRes = await getAddressList()
        addressList.value = addrRes || []
        // 默认选中默认地址
        const defaultAddr = addressList.value.find(item => item.isDefault)
        if (defaultAddr) {
            selectedAddressId.value = defaultAddr.id
        } else if (addressList.value.length > 0) {
            selectedAddressId.value = addressList.value[0].id
        }

        // 2. 获取购物车数据并过滤
        const cartRes = await getCartList()
        const allItems = cartRes.items || []
        orderItems.value = allItems.filter(item => checkoutIds.includes(item.cartItemId))

        if (orderItems.value.length === 0) {
            ElMessage.error('结算商品信息有误')
            router.replace('/cart')
        }
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
})

// 计算总金额
const totalAmount = computed(() => {
    return orderItems.value.reduce((sum, item) => sum + item.subtotalAmount, 0)
})

const currentAddress = computed(() => {
    return addressList.value.find(item => item.id === selectedAddressId.value) || {}
})

// 提交订单
const submitOrder = async () => {
    if (!selectedAddressId.value) {
        return ElMessage.warning('请选择收货地址')
    }

    try {
        const res = await createOrder({
            sourceType: 'CART',
            cartItemIds: checkoutIds,
            addressId: selectedAddressId.value,
            remark: remark.value
        })

        ElMessage.success('订单创建成功')
        // 清除结算缓存
        sessionStorage.removeItem('checkoutItems')
        // 跳转到订单详情页或支付页（这里直接跳详情去支付）
        router.replace(`/orders/${res.orderId}`)
    } catch (error) {
        // 错误已处理
    }
}
</script>

<template>
    <div class="container order-create-page" v-loading="loading">
        <div class="step-title">填写并核对订单信息</div>

        <div class="section">
            <div class="section-header">
                <span>收货人信息</span>
                <el-button link type="primary" @click="router.push('/address')">管理地址</el-button>
            </div>
            <div class="address-grid">
                <div v-for="addr in addressList" :key="addr.id" class="addr-card"
                    :class="{ active: selectedAddressId === addr.id }" @click="selectedAddressId = addr.id">
                    <div class="name">{{ addr.receiverName }} <span v-if="addr.isDefault" class="tag">默认</span></div>
                    <div class="phone">{{ addr.receiverPhone }}</div>
                    <div class="detail">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detailAddress }}
                    </div>
                </div>
                <el-empty v-if="addressList.length === 0" description="暂无收货地址，请先添加" />
            </div>
        </div>

        <div class="section">
            <div class="section-header">送货清单</div>
            <el-table :data="orderItems" border>
                <el-table-column label="商品图片" width="100" align="center">
                    <template #default="{ row }">
                        <img :src="row.productImage" class="thumb" />
                    </template>
                </el-table-column>
                <el-table-column prop="productTitle" label="商品名称" />
                <el-table-column prop="price" label="单价" width="120" align="center">
                    <template #default="{ row }">¥ {{ row.price }}</template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="100" align="center" />
                <el-table-column prop="subtotalAmount" label="小计" width="120" align="center">
                    <template #default="{ row }">¥ {{ row.subtotalAmount }}</template>
                </el-table-column>
            </el-table>

            <div class="remark-box">
                <el-input v-model="remark" placeholder="订单备注（选填）" maxlength="100" show-word-limit />
            </div>
        </div>

        <div class="checkout-bar">
            <div class="info" v-if="currentAddress.id">
                <div>寄送至：{{ currentAddress.province }} {{ currentAddress.city }} {{ currentAddress.detailAddress }}
                </div>
                <div>收货人：{{ currentAddress.receiverName }} {{ currentAddress.receiverPhone }}</div>
            </div>
            <div class="action">
                <span class="total">应付总额：<strong>¥ {{ totalAmount }}</strong></span>
                <el-button type="primary" size="large" class="submit-btn" @click="submitOrder">提交订单</el-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.order-create-page {
    background: #fff;
    padding: 20px;
    margin-top: 20px;
    min-height: 500px;
}

.step-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
}

.section {
    margin-bottom: 30px;
}

.section-header {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
}

.address-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.addr-card {
    width: 240px;
    border: 1px solid #ddd;
    padding: 15px;
    cursor: pointer;
    position: relative;
}

.addr-card:hover {
    border-color: #e4393c;
}

.addr-card.active {
    border-color: #e4393c;
    background-color: #fffdfd;
}

.addr-card.active::after {
    content: '√';
    position: absolute;
    right: 0;
    bottom: 0;
    width: 20px;
    height: 20px;
    background: #e4393c;
    color: #fff;
    text-align: center;
    line-height: 20px;
}

.addr-card .name {
    font-weight: bold;
    margin-bottom: 5px;
}

.tag {
    background: #999;
    color: #fff;
    padding: 1px 4px;
    font-size: 12px;
    border-radius: 2px;
}

.addr-card .detail {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    line-height: 1.4;
}

.thumb {
    width: 60px;
    height: 60px;
    object-fit: cover;
}

.remark-box {
    margin-top: 15px;
    width: 100%;
}

.checkout-bar {
    background: #f4f4f4;
    padding: 20px;
    text-align: right;
}

.checkout-bar .info {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
    line-height: 1.6;
}

.checkout-bar .total {
    font-size: 14px;
    margin-right: 20px;
}

.checkout-bar .total strong {
    color: #e4393c;
    font-size: 24px;
}

.submit-btn {
    width: 150px;
}
</style>