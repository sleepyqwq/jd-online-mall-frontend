<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '@/api/product'
import { ArrowRight, DArrowRight } from '@element-plus/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import Banner3D from './components/3DBanner.vue'

const router = useRouter()
const categoryTree = ref([])
const allProducts = ref([])
const loading = ref(true)

// --- 1. 优化后的滑块逻辑 (移除魔术数字) ---
const sliderStyle = ref({ opacity: 0, transform: 'translateY(0)' })

const handleMouseEnter = (e) => {
    // 直接动态获取当前 li 的位置和高度，不再需要手动算 42 * index
    const { offsetTop, offsetHeight } = e.currentTarget
    sliderStyle.value = { opacity: 1, transform: `translateY(${offsetTop}px)`, height: `${offsetHeight}px` }
}
const handleMouseLeave = () => sliderStyle.value = { ...sliderStyle.value, opacity: 0 }

// --- 2. 优化后的指令 (单例模式，性能提升 N 倍) ---
const observerMap = new WeakMap() // 用于存储元素与回调的关系(可选，这里直接操作类名无需回调)
const sharedObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Toggle class based on intersection
        entry.target.classList.toggle('slide-in-active', entry.isIntersecting)
    })
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

const vSlideIn = {
    mounted: (el) => {
        el.classList.add('slide-in-item')
        sharedObserver.observe(el)
    },
    unmounted: (el) => sharedObserver.unobserve(el)
}

// --- 3. 瀑布流/无限加载逻辑 ---
const visibleCount = ref(8)
// 切割显示数据
const visibleProducts = computed(() => allProducts.value.slice(0, visibleCount.value))
const isFullLoaded = computed(() => visibleCount.value >= allProducts.value.length)

// 数据加载哨兵 (复用上面的 observer 逻辑太复杂，不如单独开一个简单的)
const setupSentinel = (el) => {
    if (!el) return
    const sentinelObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isFullLoaded.value) {
            visibleCount.value += 8
        }
    })
    sentinelObserver.observe(el)
    onUnmounted(() => sentinelObserver.disconnect())
}

// --- 4. 初始化 ---
onMounted(async () => {
    try {
        // 使用 Promise.all 代码更紧凑，catch 统一处理错误
        const [cate, prod] = await Promise.all([
            getCategoryTree(),
            getProductList({ pageNum: 1, pageSize: 24 })
        ])
        categoryTree.value = cate || []
        allProducts.value = prod.list || []
    } catch (e) {
        console.error('Data Load Failed:', e)
    } finally {
        loading.value = false
    }
})

// 通用跳转
const navTo = (query = {}) => router.push({ path: '/products', query })
</script>

<template>
    <div class="home-container container">
        <div class="hero-section">
            <div class="category-sidebar">
                <div class="sidebar-header">主题频道</div>
                <ul class="cat-list" @mouseleave="handleMouseLeave">
                    <div class="hover-slider" :style="sliderStyle"></div>

                    <li v-for="cat in categoryTree" :key="cat.id" class="cat-item" @mouseenter="handleMouseEnter"
                        @click="navTo({ categoryId: cat.id })">
                        <div class="cat-label">
                            <span class="label-text">{{ cat.name }}</span>
                            <el-icon class="arrow-icon">
                                <ArrowRight />
                            </el-icon>
                        </div>
                        <div class="sub-cat-popover" v-if="cat.children?.length">
                            <div class="popover-content">
                                <div v-for="sub in cat.children" :key="sub.id" class="sub-item-card"
                                    @click.stop="navTo({ categoryId: sub.id })">
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
                <el-empty v-if="!allProducts.length" description="暂无商品" />
                <ProductCard v-for="prod in visibleProducts" :key="prod.id" :product="prod" v-slide-in />
            </div>
            <div v-else class="loading-skeleton"><el-skeleton :rows="3" animated /></div>

            <div class="bottom-action-area">
                <div :ref="setupSentinel" class="scroll-sentinel" v-if="!isFullLoaded && !loading"></div>

                <div class="view-all-wrapper" v-if="isFullLoaded">
                    <button class="view-all-btn" @click="navTo()">
                        浏览全部商品 <el-icon class="icon">
                            <DArrowRight />
                        </el-icon>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 仅保留核心修改的样式，其余保持不变 */

/* 1. 动画类：合并了 transition 属性 */
:global(.slide-in-item) {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: opacity, transform;
    /* 性能优化 */
}

:global(.slide-in-active) {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* 2. 滑块优化：不再需要 hardcode 高度，依靠 JS 动态计算，这里只需基础样式 */
.hover-slider {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background-color: #fff0f0;
    z-index: 100;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    /* 添加 all 以支持 height 变化 */
    pointer-events: none;
    border-left: 3px solid var(--primary-color);
}

/* 原有的大部分布局样式不需要动，已省略... */
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