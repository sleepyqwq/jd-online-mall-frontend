<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()

// 选中的行
const multipleSelection = ref([])

// 初始化
onMounted(() => {
    cartStore.fetchCart()
})

// 处理表格选中变化
const handleSelectionChange = (val) => {
    multipleSelection.value = val
}

// 计算选中商品的总价 (前端计算用于展示，实际下单金额以后端为准)
const selectedTotalAmount = computed(() => {
    return multipleSelection.value.reduce((sum, item) => {
        return sum + item.subtotalAmount
    }, 0)
})

// 处理数量变更
const handleQuantityChange = async (value, row) => {
    // 如果输入为空或非法，暂时不做处理，组件会自动回滚或保持
    if (!value) return

    try {
        // 记录旧值以便失败回滚（el-input-number 自身通常有处理，这里简化）
        await cartStore.modifyQuantity(row.cartItemId, value)
    } catch (error) {
        // 库存不足等错误，这里重新拉取一次正确数据以回滚界面显示
        await cartStore.fetchCart()
    }
}

// 删除单个
const handleDelete = (row) => {
    ElMessageBox.confirm('确认要删除该商品吗？', '提示', {
        type: 'warning'
    }).then(() => {
        cartStore.removeOne(row.cartItemId)
    }).catch(() => { })
}

// 批量删除
const handleBatchDelete = () => {
    if (multipleSelection.value.length === 0) {
        return ElMessage.warning('请选择要删除的商品')
    }

    const ids = multipleSelection.value.map(item => item.cartItemId)

    ElMessageBox.confirm(`确认删除选中的 ${ids.length} 件商品吗？`, '提示', {
        type: 'warning'
    }).then(() => {
        cartStore.removeBatch(ids)
        // 清空选中态
        multipleSelection.value = []
    }).catch(() => { })
}

// 去结算
const handleCheckout = () => {
    if (multipleSelection.value.length === 0) {
        return ElMessage.warning('请至少选择一件商品进行结算')
    }

    const ids = multipleSelection.value.map(item => item.cartItemId)

    // 跳转到确认订单页面（后续开发），并通过 state 传递选中的 IDs
    // 这里暂时假设路由为 /trade/confirm (或者复用 OrderList 结构，但通常有单独页面)
    // 根据项目结构约定，我们可能需要新建一个 View，此处先打印日志
    console.log('Checkout IDs:', ids)

    // 为了流程继续，我们将这些 ID 存入 sessionStorage 或 query 传递给下单页
    // 这里采用 query 传递稍微简单些（ID 不多时），或者 sessionStorage
    sessionStorage.setItem('checkoutItems', JSON.stringify(ids))
    router.push('/order/create') // 下一步我们将创建这个路由
}
</script>

<template>
    <div class="container cart-page">
        <div class="page-header">
            <h2>我的购物车</h2>
            <span class="count">共 {{ cartStore.totalQuantity }} 件商品</span>
        </div>

        <div class="cart-content" v-loading="cartStore.loading">
            <div v-if="!cartStore.loading && cartStore.cartList.length === 0" class="empty-cart">
                <el-empty description="购物车空空如也">
                    <el-button type="primary" @click="router.push('/')">去逛逛</el-button>
                </el-empty>
            </div>

            <template v-else>
                <el-table :data="cartStore.cartList" style="width: 100%" @selection-change="handleSelectionChange"
                    header-row-class-name="cart-header">
                    <el-table-column type="selection" width="55" />

                    <el-table-column label="商品信息" min-width="400">
                        <template #default="{ row }">
                            <div class="goods-info">
                                <img :src="row.productImage" alt="商品" class="goods-img"
                                    @click="router.push(`/products/${row.productId}`)">
                                <div class="goods-detail">
                                    <div class="name" @click="router.push(`/products/${row.productId}`)">{{
                                        row.productTitle }}</div>
                                </div>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column label="单价" width="150" align="center">
                        <template #default="{ row }">
                            ¥ {{ row.price }}
                        </template>
                    </el-table-column>

                    <el-table-column label="数量" width="200" align="center">
                        <template #default="{ row }">
                            <el-input-number v-model="row.quantity" :min="1" :max="99" size="small"
                                @change="(val) => handleQuantityChange(val, row)" />
                        </template>
                    </el-table-column>

                    <el-table-column label="小计" width="150" align="center">
                        <template #default="{ row }">
                            <span class="subtotal">¥ {{ row.subtotalAmount }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" width="100" align="center">
                        <template #default="{ row }">
                            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="cart-footer">
                    <div class="left">
                        <el-button link @click="handleBatchDelete">删除选中的商品</el-button>
                    </div>
                    <div class="right">
                        <span class="label">已选择 <span class="num">{{ multipleSelection.length }}</span> 件商品</span>
                        <span class="total-price-label">总价：</span>
                        <span class="total-price">¥ {{ selectedTotalAmount }}</span>
                        <el-button type="primary" size="large" class="checkout-btn" @click="handleCheckout">
                            去结算
                        </el-button>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.cart-page {
    padding: 20px 0;
    background: #fff;
    min-height: 500px;
}

.page-header {
    display: flex;
    align-items: baseline;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.page-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
}

.page-header .count {
    margin-left: 10px;
    font-size: 14px;
    color: #999;
}

.cart-header th {
    background-color: #f5f5f5 !important;
    color: #666;
}

.goods-info {
    display: flex;
    gap: 15px;
    align-items: center;
}

.goods-img {
    width: 80px;
    height: 80px;
    border: 1px solid #eee;
    cursor: pointer;
    object-fit: cover;
}

.goods-detail {
    flex: 1;
}

.goods-detail .name {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    cursor: pointer;
}

.goods-detail .name:hover {
    color: var(--el-color-primary);
}

.subtotal {
    color: var(--el-color-primary);
    font-weight: bold;
}

.cart-footer {
    margin-top: 20px;
    border: 1px solid #f0f0f0;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    bottom: 0;
    background: #fff;
    z-index: 10;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.cart-footer .right {
    display: flex;
    align-items: center;
    gap: 20px;
}

.num {
    color: var(--el-color-primary);
    font-weight: bold;
    margin: 0 5px;
}

.total-price {
    font-size: 24px;
    color: var(--el-color-primary);
    font-weight: bold;
    margin-right: 20px;
}

.checkout-btn {
    width: 120px;
    font-size: 18px;
}
</style>