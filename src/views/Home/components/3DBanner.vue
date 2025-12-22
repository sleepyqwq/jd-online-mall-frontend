<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router' // 1. 引入 useRouter
import { getHomeBannerList } from '@/api/banner'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter() // 2. 初始化 router
const bannerList = ref([])
const loading = ref(true)

// --- 3D 核心参数 ---
const currDeg = ref(0)
const timer = ref(null)
const CARD_WIDTH = 400
const GAP = 250

// 获取数据
const loadBanners = async () => {
    try {
        const res = await getHomeBannerList()
        if (res && res.length > 0) {
            bannerList.value = res
        } else {
            bannerList.value = []
        }
    } catch (error) {
        console.error('获取轮播图失败:', error)
        bannerList.value = []
    } finally {
        loading.value = false
        startAutoPlay()
    }
}

const radius = computed(() => {
    const count = bannerList.value.length
    if (count === 0) return 0
    if (count < 3) return 600
    return Math.round((CARD_WIDTH + GAP) / 2 / Math.tan(Math.PI / count))
})

const rotate = (direction) => {
    const count = bannerList.value.length
    if (count === 0) return
    const anglePerItem = 360 / count
    currDeg.value -= direction * anglePerItem
}

const startAutoPlay = () => {
    stopAutoPlay()
    timer.value = setInterval(() => {
        rotate(1)
    }, 4000)
}

const stopAutoPlay = () => {
    if (timer.value) clearInterval(timer.value)
}

// --- 3. 修改点击跳转逻辑 ---
const handleBannerClick = (item) => {
    if (item.redirectUrl) {
        // 判断是否为站内链接
        if (item.redirectUrl.startsWith('/')) {
            router.push(item.redirectUrl)
        } else {
            // 站外链接，本页跳转
            window.location.href = item.redirectUrl
        }
    }
}

const handleImageError = (e) => {
    e.target.style.backgroundColor = '#eee'
}

onMounted(() => {
    loadBanners()
})

onUnmounted(() => {
    stopAutoPlay()
})
</script>

<template>
    <div class="banner-stage" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay"
        v-if="!loading && bannerList.length > 0">

        <div class="carousel-container" :style="{
            transform: `translateZ(-${radius}px) rotateY(${currDeg}deg)`
        }">
            <div v-for="(item, index) in bannerList" :key="item.id" class="carousel-item" :style="{
                transform: `rotateY(${index * (360 / bannerList.length)}deg) translateZ(${radius}px)`
            }" @click="handleBannerClick(item)">
                <div class="img-box">
                    <img :src="item.imgUrl" @error="handleImageError" />
                    <div class="reflection"></div>
                </div>
                <div class="caption" v-if="item.title">{{ item.title }}</div>
            </div>
        </div>

        <div class="nav-btn prev" @click="rotate(-1)">
            <el-icon>
                <ArrowLeft />
            </el-icon>
        </div>
        <div class="nav-btn next" @click="rotate(1)">
            <el-icon>
                <ArrowRight />
            </el-icon>
        </div>
    </div>

    <div v-else class="loading-state">
        <el-empty v-if="!loading" description="暂无活动" />
        <el-skeleton v-else animated>
            <template #template>
                <el-skeleton-item variant="image" style="width: 400px; height: 300px" />
            </template>
        </el-skeleton>
    </div>
</template>

<style scoped>
/* 保持原有样式不变 */
.banner-stage {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1200px;
    overflow: hidden;
    background: transparent;
}

.carousel-container {
    width: 400px;
    height: 300px;
    position: absolute;
    transform-style: preserve-3d;
    transition: transform 1s cubic-bezier(0.2, 0.8, 0.3, 1);
}

.carousel-item {
    position: absolute;
    width: 400px;
    height: 300px;
    left: 0;
    top: 0;
    cursor: pointer;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.img-box {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    -webkit-box-reflect: below 10px linear-gradient(transparent, transparent 60%, rgba(255, 255, 255, 0.25));
}

.img-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

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
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 10;
}

.carousel-item:hover .caption {
    opacity: 1;
}

.carousel-item:hover {
    filter: brightness(1.05);
}

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
    color: rgba(209, 36, 36, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: all 0.4s ease;
}

.banner-stage:hover .nav-btn {
    opacity: 1;
}

.nav-btn:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.nav-btn.prev {
    left: 30px;
}

.nav-btn.next {
    right: 30px;
}

.loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}
</style>