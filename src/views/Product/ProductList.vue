<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductList } from '@/api/product'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const productList = ref([])
const total = ref(0)

// 筛选与排序参数
const queryParams = reactive({
    pageNum: 1,
    pageSize: 20,
    keyword: route.query.keyword || '',
    categoryId: route.query.categoryId || '',
    sortField: '', // price, createTime
    sortOrder: '' // asc, desc
})

// 加载数据
const loadData = async () => {
    loading.value = true
    try {
        // 【关键修正】构造干净的请求参数，剔除空字符串，防止后端 Long 类型解析失败
        const params = {
            pageNum: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            keyword: queryParams.keyword || undefined,
            categoryId: queryParams.categoryId || undefined, // 空串转 undefined
            sortField: queryParams.sortField || undefined,
            sortOrder: queryParams.sortOrder || undefined
        }

        const res = await getProductList(params)
        productList.value = res.list
        total.value = res.total
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

// 监听路由参数变化（如搜索词变化）
watch(
    () => route.query,
    (newQuery) => {
        queryParams.keyword = newQuery.keyword || ''
        queryParams.categoryId = newQuery.categoryId || ''
        queryParams.pageNum = 1 // 重置页码
        loadData()
    }
)

// 排序处理优化
const handleSort = (field) => {
    if (queryParams.sortField === field) {
        if (queryParams.sortOrder === 'asc') {
            queryParams.sortOrder = 'desc'
        } else {
            queryParams.sortField = ''
            queryParams.sortOrder = ''
        }
    } else {
        queryParams.sortField = field
        queryParams.sortOrder = field === 'createTime' ? 'desc' : 'asc'
    }
    queryParams.pageNum = 1
    loadData()
}

// 分页处理
const handleCurrentChange = (val) => {
    queryParams.pageNum = val
    loadData()
    window.scrollTo(0, 0)
}

// 跳转详情
const goToDetail = (id) => {
    router.push(`/products/${id}`)
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="container product-list-page">
        <div class="filter-bar">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                <el-breadcrumb-item>商品列表</el-breadcrumb-item>
                <el-breadcrumb-item v-if="queryParams.keyword">搜索："{{ queryParams.keyword }}"</el-breadcrumb-item>
            </el-breadcrumb>
        </div>

        <div class="sort-bar">
            <div class="sort-item" :class="{ active: queryParams.sortField === '' }" @click="handleSort('')">
                综合
            </div>
            <div class="sort-item" :class="{ active: queryParams.sortField === 'price' }" @click="handleSort('price')">
                价格
                <el-icon v-if="queryParams.sortField === 'price' && queryParams.sortOrder === 'asc'">
                    <Top />
                </el-icon>
                <el-icon v-else-if="queryParams.sortField === 'price' && queryParams.sortOrder === 'desc'">
                    <Bottom />
                </el-icon>
            </div>
            <div class="sort-item" :class="{ active: queryParams.sortField === 'createTime' }"
                @click="handleSort('createTime')">
                新品
            </div>
        </div>

        <div class="product-grid" v-loading="loading">
            <el-empty v-if="!loading && productList.length === 0" description="暂无相关商品" />

            <div v-for="prod in productList" :key="prod.id" class="product-item" @click="goToDetail(prod.id)">
                <div class="img-box">
                    <img :src="prod.mainImage || ''" alt="Product">
                </div>
                <div class="p-price">
                    ¥ <strong>{{ prod.price }}</strong>
                </div>
                <div class="p-title" :title="prod.title">
                    <span v-html="prod.title"></span>
                </div>
                <div class="p-commit">
                    库存: {{ prod.stock }}
                </div>
            </div>
        </div>

        <div class="pagination-box" v-if="total > 0">
            <el-pagination background layout="prev, pager, next" :total="Number(total)"
                :page-size="queryParams.pageSize" v-model:current-page="queryParams.pageNum"
                @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<style scoped>
.product-list-page {
    padding: 20px 0;
}

.filter-bar {
    margin-bottom: 20px;
}

.sort-bar {
    background: #f1f1f1;
    padding: 10px;
    display: flex;
    margin-bottom: 20px;
    border: 1px solid #ddd;
}

.sort-item {
    padding: 5px 15px;
    cursor: pointer;
    background: #fff;
    border: 1px solid #ddd;
    margin-right: -1px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.sort-item:hover {
    color: var(--el-color-primary);
}

.sort-item.active {
    background: var(--el-color-primary);
    color: #fff;
    border-color: var(--el-color-primary);
}

.product-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    min-height: 300px;
}

.product-item {
    width: 228px;
    background: #fff;
    border: 1px solid #eee;
    padding: 10px;
    cursor: pointer;
    transition: box-shadow 0.2s;
}

.product-item:hover {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.img-box {
    width: 100%;
    height: 220px;
    background: #f8f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

.img-box img {
    max-width: 100%;
    max-height: 100%;
}

.p-price {
    color: #e4393c;
    font-size: 16px;
    margin-bottom: 5px;
}

.p-price strong {
    font-size: 20px;
}

.p-title {
    height: 40px;
    overflow: hidden;
    font-size: 12px;
    line-height: 20px;
    color: #666;
    margin-bottom: 5px;
}

.p-commit {
    color: #a7a7a7;
    font-size: 12px;
}

.pagination-box {
    margin-top: 30px;
    display: flex;
    justify-content: center;
}
</style>