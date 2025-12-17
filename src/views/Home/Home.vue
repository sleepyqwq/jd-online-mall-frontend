<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '@/api/product'
import { getHomeBannerList } from '@/api/banner'
import { ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const categoryTree = ref([])
const hotProducts = ref([])
const bannerList = ref([])
const loading = ref(true)

// --- 滑块动画逻辑 ---
const sliderTop = ref(0)
const showSlider = ref(false)
const ITEM_HEIGHT = 42
const LIST_PADDING_TOP = 10

const handleMouseEnter = (index) => {
    sliderTop.value = index * ITEM_HEIGHT + LIST_PADDING_TOP
    showSlider.value = true
}

const handleMouseLeave = () => {
    showSlider.value = false
}

// 初始化数据
onMounted(async () => {
    try {
        const [cateRes, bannerRes, prodRes] = await Promise.allSettled([
            getCategoryTree(),
            getHomeBannerList(),
            getProductList({ pageNum: 1, pageSize: 8 })
        ])

        if (cateRes.status === 'fulfilled') {
            categoryTree.value = cateRes.value || []
        }
        if (bannerRes.status === 'fulfilled') {
            bannerList.value = bannerRes.value || []
        }
        if (prodRes.status === 'fulfilled') {
            hotProducts.value = prodRes.value.list || []
        }
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
})

const handleCategoryClick = (categoryId) => {
    router.push({ path: '/products', query: { categoryId } })
}

const goToDetail = (id) => {
    router.push(`/products/${id}`)
}

const handleBannerClick = (item) => {
    if (item.redirectUrl) {
        if (item.redirectUrl.startsWith('/')) {
            router.push(item.redirectUrl)
        } else {
            window.open(item.redirectUrl, '_blank')
        }
    }
}
</script>

<template>
    <div class="home-container container">

        <div class="hero-section">

            <div class="category-sidebar">
                <div class="sidebar-header">主题频道</div>

                <ul class="cat-list" @mouseleave="handleMouseLeave">
                    <div class="hover-slider" :style="{
                        transform: `translateY(${sliderTop}px)`,
                        opacity: showSlider ? 1 : 0
                    }"></div>

                    <li v-for="(cat, index) in categoryTree" :key="cat.id" class="cat-item"
                        @mouseenter="handleMouseEnter(index)">
                        <div class="cat-label" @click="handleCategoryClick(cat.id)">
                            <span class="label-text">{{ cat.name }}</span>
                            <el-icon class="arrow-icon">
                                <ArrowRight />
                            </el-icon>
                        </div>

                        <div class="sub-cat-popover" v-if="cat.children && cat.children.length > 0">
                            <div class="popover-content">
                                <div v-for="sub in cat.children" :key="sub.id" class="sub-item-card"
                                    @click.stop="handleCategoryClick(sub.id)">
                                    {{ sub.name }}
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="banner-area">
                <el-carousel height="440px" :interval="5000" arrow="hover">
                    <el-carousel-item v-for="item in bannerList" :key="item.id">
                        <img :src="item.imgUrl" class="banner-img" @click="handleBannerClick(item)" />
                    </el-carousel-item>
                    <el-carousel-item v-if="bannerList.length === 0">
                        <div class="banner-placeholder">
                            <h3>暂无精彩活动</h3>
                        </div>
                    </el-carousel-item>
                </el-carousel>
            </div>

        </div>

        <div class="recommend-section">
            <div class="section-header">
                <span class="title-main">热门推荐</span>
                <span class="title-sub">品质生活，精选好物</span>
            </div>

            <div class="product-grid" v-loading="loading">
                <el-empty v-if="hotProducts.length === 0" description="暂无热门商品" />
                <div v-for="prod in hotProducts" :key="prod.id" class="product-card" @click="goToDetail(prod.id)">
                    <div class="img-wrapper">
                        <img :src="prod.mainImage || ''" loading="lazy" alt="商品图片" class="prod-img">
                    </div>
                    <div class="prod-info">
                        <div class="price-row">
                            <span class="currency">¥</span>
                            <span class="amount">{{ prod.price }}</span>
                        </div>
                        <div class="title" :title="prod.title">{{ prod.title }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-container {
    padding-top: 20px;
    padding-bottom: 60px;
}

/* --- Hero Section (保持分离布局) --- */
.hero-section {
    display: flex;
    margin-bottom: 40px;
    gap: 20px;
    /* 侧边栏和轮播图之间的间距 */
    overflow: visible;
}

/* --- 侧边栏 (左侧独立卡片) --- */
.category-sidebar {
    width: 240px;
    height: 440px;
    background: #fff;
    position: relative;
    z-index: 101;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    /* 初始阴影 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    /* 侧边栏整体交互：鼠标移上去微微上浮，增加立体感 */
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
}

.category-sidebar:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    border-color: transparent;
}

.sidebar-header {
    height: 46px;
    line-height: 46px;
    padding-left: 24px;
    font-size: 15px;
    font-weight: 700;
    color: #333;
    letter-spacing: 1px;
    position: relative;
    z-index: 102;
    border-bottom: 1px solid #f5f5f5;
}

.cat-list {
    flex: 1;
    padding: 10px 0;
    margin: 0;
    position: relative;
}

/* 滑动高亮块 */
.hover-slider {
    position: absolute;
    left: 0;
    top: 0;
    box-sizing: border-box;
    width: 100%;
    height: 42px;
    background-color: #fff0f0;
    z-index: 100;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s;
    pointer-events: none;
    border-left: 3px solid var(--primary-color);
}

.cat-item {
    position: relative;
    z-index: 101;
}

.cat-label {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    transition: color 0.2s;
    line-height: 1;
}

.arrow-icon {
    font-size: 12px;
    color: #ccc;
    transition: color 0.2s;
}

.cat-item:hover .cat-label {
    color: var(--primary-color);
    font-weight: 500;
}

.cat-item:hover .arrow-icon {
    color: var(--primary-color);
}

/* --- 弹窗样式 (向右弹出) --- */
.sub-cat-popover {
    opacity: 0;
    visibility: hidden;
    transform: translateX(-10px);
    /* 初始位置略微偏左，营造向右滑出的感觉 */

    position: absolute;
    left: 240px;
    /* 紧贴侧边栏右侧 */
    top: 0;
    width: 500px;
    height: 440px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 8px 0 20px rgba(0, 0, 0, 0.08);
    /* 阴影向右 */
    z-index: 200;
    padding: 20px;
    box-sizing: border-box;
    border-left: 1px solid #f0f0f0;

    transition:
        opacity 0.2s ease,
        transform 0.2s ease,
        visibility 0.2s;
}

.cat-item:hover .sub-cat-popover {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
}

.popover-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    align-content: start;
}

.sub-item-card {
    cursor: pointer;
    font-size: 13px;
    color: #666;
    padding: 8px 12px;
    border-radius: 4px;
    transition: all 0.2s;
    background: #f9f9f9;
}

.sub-item-card:hover {
    color: var(--primary-color);
    background-color: #fff0f0;
}

/* --- 轮播区域 (右侧独立卡片) --- */
.banner-area {
    flex: 1;
    /* 占据剩余宽度 */
    height: 440px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    background-color: #f0f2f5;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.banner-area:hover {
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
}

.banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* 指示器与箭头样式 (保留之前的美化) */
.banner-area :deep(.el-carousel__indicators) {
    bottom: 20px;
}

.banner-area :deep(.el-carousel__indicator) {
    padding: 12px 6px;
}

.banner-area :deep(.el-carousel__button) {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    border: none;
    opacity: 1;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.banner-area :deep(.el-carousel__indicator.is-active .el-carousel__button) {
    width: 24px;
    border-radius: 4px;
    background-color: #fff;
}

.banner-area :deep(.el-carousel__arrow) {
    width: 48px;
    height: 48px;
    font-size: 20px;
    background-color: rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    transition: all 0.3s ease;
}

.banner-area :deep(.el-carousel__arrow:hover) {
    background-color: rgba(0, 0, 0, 0.5);
    transform: scale(1.1);
}

.banner-placeholder {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999;
}

/* 推荐板块 */
.recommend-section {
    margin-top: 40px;
}

.section-header {
    margin-bottom: 20px;
    display: flex;
    align-items: baseline;
}

.title-main {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-right: 12px;
}

.title-sub {
    font-size: 14px;
    color: #999;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.product-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

.product-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
    border-color: #f0f0f0;
}

.img-wrapper {
    width: 100%;
    height: 200px;
    background: #f8f8f8;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.prod-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.product-card:hover .prod-img {
    transform: scale(1.05);
}

.prod-info {
    padding: 0 4px;
}

.price-row {
    color: #e4393c;
    margin-bottom: 6px;
    display: flex;
    align-items: baseline;
}

.currency {
    font-size: 14px;
    margin-right: 2px;
}

.amount {
    font-size: 20px;
    font-weight: bold;
}

.title {
    font-size: 14px;
    color: #333;
    line-height: 1.4;
    height: 40px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>