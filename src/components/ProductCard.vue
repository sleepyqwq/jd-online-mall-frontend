<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
    product: {
        type: Object,
        required: true,
        default: () => ({})
    }
})

const router = useRouter()

const handleClick = () => {
    if (props.product.id) {
        router.push(`/products/${props.product.id}`)
    }
}
</script>

<template>
    <div class="product-card" @click="handleClick">
        <div class="img-wrapper">
            <img :src="product.mainImage || ''" loading="lazy" alt="商品图片" class="prod-img">
        </div>

        <div class="prod-info">
            <div class="price-row">
                <span class="currency">¥</span>
                <span class="amount">{{ product.price }}</span>
            </div>

            <div class="title" :title="product.title">
                {{ product.title }}
            </div>

            <div class="description" v-if="product.description">
                {{ product.description }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.product-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    /* 预留边框位置避免抖动 */

    /* 确保卡片撑满父容器 */
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

/* 悬停效果：上浮 + 投影 + 边框 */
.product-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
    border-color: #f0f0f0;
}

/* 图片容器 */
.img-wrapper {
    width: 100%;
    /* 固定高度保持整齐，或者使用 aspect-ratio */
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

/* 图片悬停放大 */
.product-card:hover .prod-img {
    transform: scale(1.05);
}

.prod-info {
    padding: 0 4px;
    flex: 1;
    display: flex;
    flex-direction: column;
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
    /* 2行的高度 */
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 6px;
}

/* 新增：简介样式 */
.description {
    font-size: 12px;
    color: #999;
    line-height: 1.4;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>