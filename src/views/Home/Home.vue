<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '@/api/product'

const router = useRouter()
const categoryTree = ref([])
const hotProducts = ref([])
const loading = ref(true)

// 初始化加载数据
onMounted(async () => {
    try {
        // 并行请求分类和商品
        const [cateRes, prodRes] = await Promise.all([
            getCategoryTree(),
            getProductList({ pageNum: 1, pageSize: 8 }) // 获取前8个作为热门展示
        ])
        categoryTree.value = cateRes || []
        hotProducts.value = prodRes.list || []
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
                        <div class="sub-cat-popover" v-if="cat.children && cat.children.length">
                            <div v-for="sub in cat.children" :key="sub.id" class="sub-item"
                                @click.stop="handleCategoryClick(sub.id)">
                                {{ sub.name }}
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="content-area">
                <el-carousel height="300px" class="banner">
                    <el-carousel-item v-for="item in 3" :key="item">
                        <div class="banner-placeholder">
                            <h3>活动展示位 {{ item }}</h3>
                            <p>（此处展示轮播图）</p>
                        </div>
                    </el-carousel-item>
                </el-carousel>
            </div>
        </div>

        <div class="section-title">热门推荐</div>
        <div class="product-grid" v-loading="loading">
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
.home-container {
    padding-top: 20px;
    padding-bottom: 40px;
}

.main-area {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
}

/* 分类侧边栏 */
.category-sidebar {
    width: 200px;
    background: #fff;
    border: 1px solid #ddd;
    height: 400px;
    position: relative;
}

.cat-title {
    padding: 10px 15px;
    background: #f8f8f8;
    font-weight: bold;
    border-bottom: 1px solid #eee;
}

.cat-list {
    padding: 5px 0;
}

.cat-item {
    position: relative;
}

.cat-label {
    padding: 10px 15px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.cat-label:hover {
    background-color: #f0f0f0;
    color: var(--el-color-primary);
}

/* 二级分类弹层 */
.sub-cat-popover {
    display: none;
    position: absolute;
    left: 199px;
    top: 0;
    width: 400px;
    min-height: 400px;
    background: #fff;
    border: 1px solid #ddd;
    padding: 20px;
    z-index: 99;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 15px;
}

/* 纯 CSS 实现 Hover 显示 */
.cat-item:hover .sub-cat-popover {
    display: flex;
}

.sub-item {
    cursor: pointer;
    font-size: 13px;
    color: #666;
    padding: 0 10px;
    border-left: 1px solid #eee;
}

.sub-item:hover {
    color: var(--el-color-primary);
}

/* 轮播图区域 */
.content-area {
    flex: 1;
}

.banner-placeholder {
    height: 100%;
    background-color: #eef2f5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #999;
}

/* 商品网格 */
.section-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
    border-left: 4px solid var(--el-color-primary);
    padding-left: 10px;
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
    border: 1px solid transparent;
}

.product-card:hover {
    border-color: #eee;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.img-wrapper {
    width: 100%;
    height: 200px;
    background: #f9f9f9;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.prod-img {
    max-width: 100%;
    max-height: 100%;
}

.price {
    color: #e4393c;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
}

.title {
    font-size: 14px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
    height: 42px;
}
</style>