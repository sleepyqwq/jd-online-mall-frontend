<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '@/api/product'
import { ArrowRight, DArrowRight } from '@element-plus/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import Banner3D from './components/3DBanner.vue'

const router = useRouter()
const categoryTree = ref([])
const allHotProducts = ref([])
const loading = ref(true)

// --- 渐进式显示逻辑 ---
const visibleCount = ref(8)
const sentinelRef = ref(null)
let dataObserver = null

const visibleProducts = computed(() => {
    return allHotProducts.value.slice(0, visibleCount.value)
})

const isFullLoaded = computed(() => {
    return visibleCount.value >= allHotProducts.value.length && allHotProducts.value.length > 0
})

// --- [核心修改] 动画指令 v-slide-in ---
const vSlideIn = {
    mounted: (el) => {
        // 1. 初始状态：强制隐藏
        el.classList.add('slide-in-item') // 添加一个基础类，用于写 transition
        el.classList.remove('slide-in-active') // 确保初始没有激活

        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 进入屏幕：添加激活类 -> 浮现
                    el.classList.add('slide-in-active')
                } else {
                    // [关键点] 离开屏幕：移除激活类 -> 变回透明下沉状态
                    // 这样下次进入时，又会重新触发动画
                    el.classList.remove('slide-in-active')
                }
            })
        }, {
            threshold: 0.1, // 露出 10% 触发
            rootMargin: '0px 0px -50px 0px'
        })

        animationObserver.observe(el)
        // 注意：这里删除了 unobserve，让它一直保持监控
    }
}

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

// --- 数据预加载观察者 ---
const setupDataObserver = () => {
    dataObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount.value < allHotProducts.value.length) {
            visibleCount.value += 8
        }
    }, {
        rootMargin: '0px 0px 600px 0px',
        threshold: 0
    })

    if (sentinelRef.value) {
        dataObserver.observe(sentinelRef.value)
    }
}

// 初始化数据
onMounted(async () => {
    try {
        const [cateRes, prodRes] = await Promise.allSettled([
            getCategoryTree(),
            getProductList({ pageNum: 1, pageSize: 24 })
        ])

        if (cateRes.status === 'fulfilled') {
            categoryTree.value = cateRes.value || []
        }
        if (prodRes.status === 'fulfilled') {
            allHotProducts.value = prodRes.value.list || []
            nextTick(() => {
                setupDataObserver()
            })
        }
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
})

onUnmounted(() => {
    if (dataObserver) dataObserver.disconnect()
})

const handleCategoryClick = (categoryId) => {
    router.push({ path: '/products', query: { categoryId } })
}

const goToProductList = () => {
    router.push('/products')
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

            <div class="right-banner-wrapper">
                <Banner3D />
            </div>
        </div>

        <div class="recommend-section">
            <div class="section-header">
                <span class="title-main">热门推荐</span>
                <span class="title-sub">品质生活，精选好物</span>
            </div>

            <div class="product-grid" v-if="!loading">
                <el-empty v-if="allHotProducts.length === 0" description="暂无热门商品" />

                <ProductCard v-for="prod in visibleProducts" :key="prod.id" :product="prod" v-slide-in />
            </div>

            <div v-else class="loading-skeleton">
                <el-skeleton :rows="3" animated />
            </div>

            <div class="bottom-action-area">
                <div ref="sentinelRef" class="scroll-sentinel" v-if="!isFullLoaded && !loading"
                    style="height: 20px; opacity: 0;"></div>

                <div class="view-all-wrapper" v-if="isFullLoaded">
                    <button class="view-all-btn" @click="goToProductList">
                        浏览全部商品
                        <el-icon class="icon">
                            <DArrowRight />
                        </el-icon>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* --- 动画样式修改 --- */

/* 1. 基础状态：所有卡片都必须有过渡属性，否则消失时会很生硬 */
:global(.slide-in-item) {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
    /* 稍微缩小一点，增加呼吸感 */
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    /* 这里把 transition 放在基础类上 
       是为了保证“进入”和“离开”都有平滑动画
    */
}

/* 2. 激活状态：回到原位 */
:global(.slide-in-active) {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* --- 其他原有样式 --- */
.home-container {
    padding-top: 20px;
    padding-bottom: 60px;
}

.hero-section {
    display: flex;
    margin-bottom: 40px;
    gap: 20px;
    overflow: visible;
}

.right-banner-wrapper {
    flex: 1;
    height: 440px;
    border-radius: 12px;
    background-color: #f5f7fa;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.category-sidebar {
    width: 240px;
    height: 440px;
    background: #fff;
    position: relative;
    z-index: 101;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
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

.sub-cat-popover {
    opacity: 0;
    visibility: hidden;
    transform: translateX(-10px);
    position: absolute;
    left: 240px;
    top: 0;
    width: 500px;
    height: 440px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 8px 0 20px rgba(0, 0, 0, 0.08);
    z-index: 200;
    padding: 20px;
    box-sizing: border-box;
    border-left: 1px solid #f0f0f0;
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
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
    min-height: 300px;
}

.bottom-action-area {
    margin-top: 20px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.view-all-wrapper {
    animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.view-all-btn {
    background: #fff;
    color: #333;
    border: 1px solid #e0e0e0;
    padding: 12px 36px;
    border-radius: 50px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.view-all-btn:hover {
    background: #e4393c;
    color: #fff;
    border-color: #e4393c;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(228, 57, 60, 0.25);
}

.view-all-btn .icon {
    transition: transform 0.3s;
}

.view-all-btn:hover .icon {
    transform: translateX(4px);
}
</style>