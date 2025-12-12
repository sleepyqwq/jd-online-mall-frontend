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
        // 1. 获取分类树
        const cateRes = await getCategoryTree()
        categoryTree.value = cateRes || []

        // 2. 尝试获取商品 (容错处理：如果后端没写商品接口，不影响分类显示)
        try {
            const prodRes = await getProductList({ pageNum: 1, pageSize: 8 })
            hotProducts.value = prodRes.list || []
        } catch (e) {
            console.warn('商品接口暂未实现或报错，跳过加载')
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
                <el-carousel height="400px" class="banner">
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
.home-container {
    padding-top: 20px;
    padding-bottom: 40px;
}

.main-area {
    display: flex;
    gap: 10px;
    /* 减小间隙，防止鼠标移动时弹层消失 */
    margin-bottom: 30px;
}

/* --- 分类侧边栏核心样式 --- */
.category-sidebar {
    width: 200px;
    background: #fff;
    border: 1px solid #ddd;
    height: 440px;
    /* 稍微调高一点，配合轮播图高度 */
    position: relative;
    /* 关键：作为绝对定位的父容器 */
    z-index: 101;
    box-sizing: border-box;
}

.cat-title {
    padding: 10px 15px;
    background: #e4393c;
    /* 京东红背景 */
    color: #fff;
    font-weight: bold;
    font-size: 16px;
}

.cat-list {
    padding: 0;
    margin: 0;
}

.cat-item {
    /* 注意：这里去掉了 position: relative */
    /* 这样子元素的 absolute 就会去寻找最近的 relative 祖先（也就是 category-sidebar） */
    /* 从而实现二级菜单始终与侧边栏顶部对齐 */
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

/* 鼠标悬停一级分类时的样式 */
.cat-item:hover .cat-label {
    background-color: #d9d9d9;
    color: #e4393c;
    font-weight: bold;
}

/* --- 二级分类弹层样式 --- */
.sub-cat-popover {
    display: none;
    /* 【关键】默认隐藏 */
    position: absolute;
    left: 199px;
    /* 紧贴侧边栏右侧 (200px宽度 - 1px边框) */
    top: 0;
    width: 600px;
    /* 弹层宽度 */
    height: 100%;
    /* 高度铺满侧边栏 */
    background: #fff;
    border: 1px solid #ddd;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 200;
    /* 确保在轮播图之上 */
    padding: 20px;
    box-sizing: border-box;
}

/* 【关键】鼠标悬停在一级项上时，显示其内部的弹层 */
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
    /* 左侧分割线 */
    line-height: 1.2;
}

/* 去掉第一个子项的左边框，解决“| 手机”这种丑陋的显示 */
.sub-item:first-child {
    border-left: none;
    padding-left: 0;
}

.sub-item:hover {
    color: var(--el-color-primary);
    text-decoration: underline;
}

/* --- 右侧轮播图与内容 --- */
.content-area {
    flex: 1;
    overflow: hidden;
    /* 防止溢出 */
}

.banner {
    border-radius: 8px;
    /* 圆角美化 */
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

/* --- 商品网格 --- */
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