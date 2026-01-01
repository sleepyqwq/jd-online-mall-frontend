<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeBannerList } from '@/api/banner'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const bannerList = ref([])
const loading = ref(true)
const currDeg = ref(0)
let timer = null

// --- 1. 核心 3D 参数计算 (提取出来，模板更干净) ---
const count = computed(() => bannerList.value.length)
const angleStep = computed(() => 360 / (count.value || 1)) // 每一项的角度
const radius = computed(() => {
    // 只有1-2张图时推远一点，防止重叠
    if (count.value < 3) return 600
    // 3D 环形半径公式: (宽度 + 间距) / 2 / tan(PI / 数量)
    return Math.round(325 / Math.tan(Math.PI / count.value))
})

const loadBanners = async () => {
    try {
        // --- 2. 简化赋值逻辑 ---
        bannerList.value = (await getHomeBannerList()) || []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
        if (count.value > 1) startAutoPlay()
    }
}

const rotate = (dir) => currDeg.value -= dir * angleStep.value
const startAutoPlay = () => {
    stopAutoPlay()
    timer = setInterval(() => rotate(1), 4000)
}
const stopAutoPlay = () => clearInterval(timer)

const handleClick = (item) => {
    if (!item.redirectUrl) return
    item.redirectUrl.startsWith('/') ? router.push(item.redirectUrl) : window.location.href = item.redirectUrl
}

// --- 3. 简化错误处理 ---
// 仅隐藏破碎图片，保留背景色即可，无需复杂的 DOM 遍历
const hideImg = (e) => e.target.style.opacity = 0

onMounted(loadBanners)
onUnmounted(stopAutoPlay)
</script>

<template>
    <div class="banner-stage" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay" v-if="!loading && count > 0">
        <div class="carousel-container" :style="{ transform: `translateZ(-${radius}px) rotateY(${currDeg}deg)` }">
            <div v-for="(item, index) in bannerList" :key="item.id" class="carousel-item"
                :style="{ transform: `rotateY(${index * angleStep}deg) translateZ(${radius}px)` }"
                @click="handleClick(item)">

                <div class="img-box">
                    <div class="blur-bg" :style="{ backgroundImage: `url(${item.imgUrl})` }"></div>
                    <img :src="item.imgUrl" @error="hideImg" />
                    <div class="reflection"></div>
                </div>
                <div class="caption" v-if="item.title">{{ item.title }}</div>
            </div>
        </div>

        <div class="nav-btn prev" @click="rotate(-1)"><el-icon>
                <ArrowLeft />
            </el-icon></div>
        <div class="nav-btn next" @click="rotate(1)"><el-icon>
                <ArrowRight />
            </el-icon></div>
    </div>

    <div v-else class="loading-state">
        <el-empty v-if="!loading" description="暂无活动" />
        <el-skeleton v-else animated>
            <template #template><el-skeleton-item variant="image" class="sk-img" /></template>
        </el-skeleton>
    </div>
</template>

<style scoped>
/* 容器布局 */
.banner-stage {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1200px;
    overflow: hidden;
}

.carousel-container {
    width: 400px;
    height: 300px;
    position: absolute;
    transform-style: preserve-3d;
    transition: transform 1s cubic-bezier(0.2, 0.8, 0.3, 1);
}

/* 单个卡片 */
.carousel-item {
    position: absolute;
    inset: 0;
    /* 简写 left:0; top:0; width:100%... */
    cursor: pointer;
    border-radius: 12px;
    /* 移除背景色和 shadow，交给 img-box */
}

/* 图片区域与特效 */
.img-box {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    background: #f8f9fa;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    -webkit-box-reflect: below 10px linear-gradient(transparent, transparent 60%, rgba(255, 255, 255, 0.25));
}

.carousel-item:hover .img-box {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* 图片层叠 */
.blur-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(15px) brightness(0.85);
    transform: scale(1.2);
    z-index: 1;
}

.img-box img {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 2;
    object-fit: contain;
    display: block;
}

/* 标题 */
.caption {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: 0.3s;
    pointer-events: none;
    z-index: 10;
}

.carousel-item:hover .caption {
    opacity: 1;
}

/* 导航按钮 */
.nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 100;
    font-size: 22px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #d12424;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: all 0.4s;
}

.banner-stage:hover .nav-btn {
    opacity: 1;
}

.nav-btn:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: translateY(-50%) scale(1.1);
}

.prev {
    left: 30px;
}

.next {
    right: 30px;
}

/* 状态 */
.loading-state {
    height: 100%;
    display: grid;
    place-items: center;
}

.sk-img {
    width: 400px;
    height: 300px;
}
</style>