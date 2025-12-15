<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const product = ref({})
const loading = ref(true)
const buyCount = ref(1)
// 当前展示的大图
const currentImage = ref('')

// 获取商品详情
const loadDetail = async () => {
    const id = route.params.id
    try {
        const res = await getProductDetail(id)
        product.value = res
        // 默认显示主图
        if (res.mainImage) {
            currentImage.value = res.mainImage
        } else if (res.images && res.images.length > 0) {
            currentImage.value = res.images[0]
        } else {
            currentImage.value = ''
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('获取商品详情失败')
    } finally {
        loading.value = false
    }
}

// 切换图片
const handleImageEnter = (img) => {
    currentImage.value = img
}

// 加入购物车
const handleAddToCart = async () => {
    if (!userStore.token) {
        ElMessage.warning('请先登录')
        router.push(`/login?redirect=${route.fullPath}`)
        return
    }

    try {
        await addToCart({
            productId: product.value.id,
            quantity: buyCount.value
        })
        ElMessage.success('加入购物车成功')
        // 可选：弹窗询问去结算还是继续购物，这里简单处理
    } catch (error) {
        // 错误已统一处理
    }
}

// 立即购买 (简化：加入购物车后跳转购物车)
const handleBuyNow = async () => {
    if (!userStore.token) {
        ElMessage.warning('请先登录')
        router.push(`/login?redirect=${route.fullPath}`)
        return
    }

    try {
        await addToCart({
            productId: product.value.id,
            quantity: buyCount.value
        })
        router.push('/cart')
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadDetail()
})
</script>

<template>
    <div class="container detail-page" v-if="!loading">
        <div class="product-intro">
            <div class="preview-wrap">
                <div class="main-img-box">
                    <img :src="currentImage" alt="Main" />
                </div>
                <div class="spec-list">
                    <div class="spec-item" v-for="(img, index) in product.images" :key="index"
                        :class="{ active: currentImage === img }" @mouseenter="handleImageEnter(img)">
                        <img :src="img" alt="Thumbnail" />
                    </div>
                </div>
            </div>

            <div class="item-info">
                <div class="sku-name">{{ product.title }}</div>
                <div class="news" v-if="product.subTitle">{{ product.subTitle }}</div>

                <div class="summary">
                    <div class="summary-price-wrap">
                        <div class="dt">价　格</div>
                        <div class="dd">
                            <span class="p-price">¥ {{ product.price }}</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="dt">库　存</div>
                        <div class="dd">{{ product.stock }} 件</div>
                    </div>
                </div>

                <div class="choose-btns">
                    <div class="choose-amount">
                        <el-input-number v-model="buyCount" :min="1" :max="product.stock" />
                    </div>
                    <div class="btns">
                        <el-button type="warning" size="large" @click="handleAddToCart">加入购物车</el-button>
                        <el-button type="danger" size="large" @click="handleBuyNow">立即购买</el-button>
                    </div>
                </div>
            </div>
        </div>

        <div class="detail-content">
            <div class="tab-header">商品介绍</div>
            <div class="tab-content" v-html="product.description || '暂无详细介绍'"></div>
        </div>
    </div>

    <div v-else class="container loading-state">
        <el-skeleton :rows="10" animated />
    </div>
</template>

<style scoped>
.detail-page {
    padding: 20px 0;
    background: #fff;
    margin-top: 20px;
}

.product-intro {
    display: flex;
    gap: 30px;
    padding-bottom: 30px;
    border-bottom: 1px solid #eee;
}

.preview-wrap {
    width: 400px;
}

.main-img-box {
    width: 400px;
    height: 400px;
    border: 1px solid #eee;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.main-img-box img {
    max-width: 100%;
    max-height: 100%;
}

.spec-list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
}

.spec-item {
    width: 60px;
    height: 60px;
    border: 2px solid transparent;
    cursor: pointer;
}

.spec-item.active {
    border-color: #e4393c;
}

.spec-item img {
    width: 100%;
    height: 100%;
}

.item-info {
    flex: 1;
}

.sku-name {
    font-size: 16px;
    font-weight: 700;
    color: #666;
    margin-bottom: 10px;
}

.news {
    color: #e4393c;
    margin-bottom: 10px;
    font-size: 12px;
}

.summary {
    background: #f3f3f3;
    padding: 10px;
    margin-bottom: 20px;
}

.summary-price-wrap {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.summary-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    color: #999;
    font-size: 12px;
}

.dt {
    width: 60px;
    padding-left: 10px;
    font-family: simsun;
}

.p-price {
    color: #e4393c;
    font-size: 24px;
    font-weight: 700;
}

.choose-btns {
    margin-top: 20px;
    display: flex;
    gap: 20px;
    align-items: center;
}

.detail-content {
    margin-top: 30px;
    padding: 0 20px;
}

.tab-header {
    background: #f7f7f7;
    border: 1px solid #eee;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 20px;
}

.loading-state {
    padding: 20px;
    background: #fff;
    margin-top: 20px;
}
</style>