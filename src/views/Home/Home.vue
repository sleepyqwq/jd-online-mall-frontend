<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '@/api/product'
// 1. 引入 banner API
import { getHomeBannerList } from '@/api/banner'

const router = useRouter()
const categoryTree = ref([])
const hotProducts = ref([])
// 2. 定义 banner 数据
const bannerList = ref([])
const loading = ref(true)

// 初始化加载数据
onMounted(async () => {
    try {
        // 并行请求数据，提升加载速度
        const [cateRes, bannerRes, prodRes] = await Promise.allSettled([
            getCategoryTree(),
            getHomeBannerList(),
            getProductList({ pageNum: 1, pageSize: 8 })
        ])

        // 处理分类
        if (cateRes.status === 'fulfilled') {
            categoryTree.value = cateRes.value || []
        }

        // 3. 处理轮播图
        if (bannerRes.status === 'fulfilled') {
            bannerList.value = bannerRes.value || []
        }

        // 处理热门商品
        if (prodRes.status === 'fulfilled') {
            hotProducts.value = prodRes.value.list || []
        }

    } catch (error) {
        console.error('Home data load failed', error)
    } finally {
        loading.value = false
    }
})

// 点击一级分类跳转
const handleCategoryClick = (categoryId) => {
    router.push({ path: '/products', query: { categoryId } })
}

// 点击商品跳转
const goToDetail = (id) => {
    router.push(`/products/${id}`)
}

// 4. 点击轮播图跳转逻辑
const handleBannerClick = (item) => {
    if (item.redirectUrl) {
        // 如果是站内链接 (以 / 开头)，使用 router 跳转
        if (item.redirectUrl.startsWith('/')) {
            router.push(item.redirectUrl)
        } else {
            // 否则视为外部链接，新窗口打开
            window.open(item.redirectUrl, '_blank')
        }
    }
}
</script>

<template>
    <div class="home-container container">
        <div class="main-area">
            <div class="category-sidebar">
                <div class="cat-title">全部分类</div>
                <ul class="cat-list">
                    <li v-for="cat in categoryTree" :key="cat.id" class="cat-item">
                        <div class="cat-label" @click="handleCategoryClick(cat.id)">
                            <span>{{ cat.name }}</span>
                            <el-icon>
                                <ArrowRight />
                            </el-icon>
                        </div>
                        <div class="sub-cat-popover" v-if="cat.children && cat.children.length > 0">
                            <div class="popover-content">
                                <div v-for="sub in cat.children" :key="sub.id" class="sub-item"
                                    @click.stop="handleCategoryClick(sub.id)">
                                    {{ sub.name }}
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="content-area">
                <el-carousel height="440px" class="banner" :interval="4000">
                    <el-carousel-item v-for="item in bannerList" :key="item.id">
                        <img :src="item.imgUrl" class="banner-img" @click="handleBannerClick(item)" />
                    </el-carousel-item>

                    <el-carousel-item v-if="bannerList.length === 0">
                        <div class="banner-placeholder">
                            <h3>暂无活动</h3>
                        </div>
                    </el-carousel-item>
                </el-carousel>
            </div>
        </div>

        <div class="section-title">热门推荐</div>
        <div class="product-grid" v-loading="loading">
            <el-empty v-if="hotProducts.length === 0" description="暂无热门商品" />
            <div v-for="prod in hotProducts" :key="prod.id" class="product-card" @click="goToDetail(prod.id)">
                <div class="img-wrapper">
                    <img :src="prod.mainImage || ''" alt="商品图片" class="prod-img">
                </div>
                <div class="prod-info">
                    <div class="price">¥ {{ prod.price }}</div>
                    <div class="title" :title="prod.title">{{ prod.title }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 保持原有样式，新增 banner-img 样式 */
.home-container {
    padding-top: 20px;
    padding-bottom: 40px;
}

.main-area {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
}

.category-sidebar {
    width: 200px;
    background: #fff;
    border: 1px solid #ddd;
    height: 440px;
    /* 确保侧边栏高度与轮播图一致 */
    position: relative;
    z-index: 101;
    box-sizing: border-box;
}

.cat-title {
    padding: 10px 15px;
    background: #e4393c;
    color: #fff;
    font-weight: bold;
    font-size: 16px;
}

.cat-list {
    padding: 0;
    margin: 0;
}

.cat-label {
    padding: 0 15px;
    height: 40px;
    line-height: 40px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #333;
    transition: background-color 0.2s;
}

.cat-item:hover .cat-label {
    background-color: #d9d9d9;
    color: #e4393c;
    font-weight: bold;
}

.sub-cat-popover {
    display: none;
    position: absolute;
    left: 199px;
    top: 0;
    width: 600px;
    height: 100%;
    background: #fff;
    border: 1px solid #ddd;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 200;
    padding: 20px;
    box-sizing: border-box;
}

.cat-item:hover .sub-cat-popover {
    display: block;
}

.popover-content {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-content: flex-start;
}

.sub-item {
    cursor: pointer;
    font-size: 13px;
    color: #666;
    padding: 0 10px;
    border-left: 1px solid #eee;
    line-height: 1.2;
}

.sub-item:first-child {
    border-left: none;
    padding-left: 0;
}

.sub-item:hover {
    color: var(--el-color-primary);
    text-decoration: underline;
}

.content-area {
    flex: 1;
    overflow: hidden;
}

.banner {
    border-radius: 0;
    /* 根据JD风格，通常不需要大圆角，如果需要可设为 8px */
}

/* --- 新增样式: 轮播图图片填充 --- */
.banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* 保证图片填满且不变形 */
    cursor: pointer;
}

.banner-placeholder {
    height: 100%;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #999;
}

.section-title {
    font-size: 22px;
    font-weight: bold;
    margin: 20px 0;
    display: flex;
    align-items: center;
}

.section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: #e4393c;
    margin-right: 10px;
    border-radius: 2px;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.product-card {
    background: #fff;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
}

.product-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.img-wrapper {
    width: 100%;
    height: 200px;
    background: #f9f9f9;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    overflow: hidden;
}

.prod-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}

.price {
    color: #e4393c;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 6px;
}

.title {
    font-size: 14px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
    height: 42px;
}
</style>