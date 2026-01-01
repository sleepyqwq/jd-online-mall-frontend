<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductList } from '@/api/product'
import { Top, Bottom } from '@element-plus/icons-vue'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const productList = ref([])
const total = ref(0)

// 筛选与排序参数
const queryParams = reactive({
    pageNum: 1,
    pageSize: 10, // [修改] 默认显示数量改为 12
    keyword: route.query.keyword || '',
    categoryId: route.query.categoryId || '',
    sortField: '',
    sortOrder: ''
})

// 加载数据
const loadData = async () => {
    loading.value = true
    try {
        const params = {
            pageNum: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            keyword: queryParams.keyword || undefined,
            categoryId: queryParams.categoryId || undefined,
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

// 监听路由参数变化
watch(
    () => route.query,
    (newQuery) => {
        queryParams.keyword = newQuery.keyword || ''
        queryParams.categoryId = newQuery.categoryId || ''
        queryParams.pageNum = 1
        loadData()
    }
)

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

const handleCurrentChange = (val) => {
    queryParams.pageNum = val
    loadData()
    window.scrollTo(0, 0)
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

            <ProductCard v-for="prod in productList" :key="prod.id" :product="prod" />
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

/* 优化：使用 Grid 布局替代原来的 Flex 布局 */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    min-height: 300px;
}

.pagination-box {
    margin-top: 30px;
    display: flex;
    justify-content: center;
}
</style>