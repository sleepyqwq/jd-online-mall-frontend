<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const product = ref({})
const loading = ref(true)
const buyCount = ref(1)

const loadDetail = async () => {
    const id = route.params.id
    try {
        const res = await getProductDetail(id)
        product.value = res
    } catch (error) {
        console.error(error)
        ElMessage.error('获取商品详情失败')
    } finally {
        loading.value = false
    }
}

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
        await cartStore.fetchCart()
        ElMessage.success('加入购物车成功')
    } catch (error) {
        console.error(error)
    }
}

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
                <el-carousel :interval="4000" type="card" height="380px" indicator-position="outside" trigger="click">
                    <el-carousel-item v-for="(img, index) in product.images" :key="index" class="carousel-card">
                        <div class="card-content">
                            <div class="blur-background" :style="{ backgroundImage: `url(${img})` }"></div>
                            <img :src="img" alt="Product Image" class="real-img" />
                        </div>
                    </el-carousel-item>
                </el-carousel>
            </div>

            <div class="item-info">
                <div class="info-header">
                    <h1 class="sku-name">{{ product.title }}</h1>
                    <p class="news" v-if="product.subTitle">{{ product.subTitle }}</p>
                </div>

                <div class="summary">
                    <div class="summary-price-wrap">
                        <span class="currency">¥</span>
                        <span class="p-price">{{ product.price }}</span>
                    </div>
                </div>

                <div class="choose-btns">
                    <div class="choose-label">数量</div>
                    <div class="choose-amount">
                        <el-input-number v-model="buyCount" :min="1" :max="product.stock" size="large" />
                    </div>
                </div>

                <div class="action-bar">
                    <el-button type="warning" size="large" class="action-btn" @click="handleAddToCart">
                        加入购物车
                    </el-button>
                    <el-button type="danger" size="large" class="action-btn" @click="handleBuyNow">
                        立即购买
                    </el-button>
                </div>
            </div>
        </div>

        <div class="detail-content">
            <div class="section-header">
                <span class="title">商品介绍</span>
            </div>
            <div class="tab-content" v-html="product.description || '<p style=\'color:#999;padding:20px\'>暂无详细介绍</p>'">
            </div>
        </div>
    </div>

    <div v-else class="container loading-state">
        <el-skeleton :rows="10" animated />
    </div>
</template>

<style scoped>
.detail-page {
    background: #fff;
    margin-top: 20px;
    margin-bottom: 40px;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.product-intro {
    display: flex;
    gap: 50px;
    padding-bottom: 40px;
}

.preview-wrap {
    width: 450px;
    flex-shrink: 0;
}

/* --- 3D 轮播图样式优化 --- */
.card-content {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: #f8f8f8;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.05);

    /* 默认给所有卡片加上过渡动画 */
    transition: all 0.4s ease;
}

/* 核心修改：给【非当前激活】的卡片添加模糊和变暗效果 */
.el-carousel__item:not(.is-active) .card-content {
    /* 模糊 4px */
    filter: blur(4px) brightness(0.9);
    /* 也可以尝试 opacity: 0.8; */
}

/* 当前激活的卡片：清晰、明亮、有阴影 */
.el-carousel__item.is-active .card-content {
    filter: blur(0) brightness(1);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: transparent;
}

/* 毛玻璃背景层 */
.blur-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(20px) opacity(0.5);
    transform: scale(1.2);
    z-index: 1;
}

.real-img {
    position: relative;
    z-index: 2;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* 右侧信息区 */
.item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.info-header {
    margin-bottom: 20px;
}

.sku-name {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    margin-bottom: 12px;
}

.news {
    color: #e4393c;
    font-size: 14px;
    line-height: 1.5;
}

.summary {
    padding: 20px 0;
    border-top: 1px dashed #e0e0e0;
    border-bottom: 1px dashed #e0e0e0;
    margin-bottom: 30px;
}

.summary-price-wrap {
    display: flex;
    align-items: baseline;
    color: #e4393c;
}

.currency {
    font-size: 18px;
    margin-right: 4px;
    font-weight: 600;
}

.p-price {
    font-size: 32px;
    font-weight: 700;
    font-family: Arial, sans-serif;
}

.choose-btns {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 30px;
}

.choose-label {
    font-size: 14px;
    color: #666;
}

.action-bar {
    display: flex;
    gap: 20px;
    margin-top: auto;
}

.action-btn {
    width: 160px;
    font-weight: 600;
    border-radius: 4px;
}

.detail-content {
    margin-top: 20px;
}

.section-header {
    border-bottom: 1px solid #eee;
    margin-bottom: 30px;
    display: flex;
}

.section-header .title {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    padding: 12px 0;
    border-bottom: 3px solid #e4393c;
    margin-bottom: -1px;
}

.tab-content {
    line-height: 1.6;
    color: #666;
    white-space: pre-wrap;
    font-size: 14px;
}

:deep(.tab-content img) {
    max-width: 100%;
    display: block;
    margin: 0 auto;
}

.loading-state {
    padding: 40px;
    background: #fff;
    margin-top: 20px;
    border-radius: 8px;
}
</style>