<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAddressList, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/api/address'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
    id: '',
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    isDefault: false // Element Plus Switch 绑定布尔值
})

// 【修改点1】补全缺失的校验规则，与后端 @NotBlank 对应
const rules = {
    receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
    receiverPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
    city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
    district: [{ required: true, message: '请输入区县', trigger: 'blur' }],
    detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const loadData = async () => {
    loading.value = true
    try {
        const res = await getAddressList()
        // 后端返回的是 0/1，前端 switch 需要 boolean，这里做一个转换处理显示
        list.value = (res || []).map(item => ({
            ...item,
            isDefault: item.isDefault === 1
        }))
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

const openAdd = () => {
    isEdit.value = false
    // 重置表单
    form.id = ''
    form.receiverName = ''
    form.receiverPhone = ''
    form.province = ''
    form.city = ''
    form.district = ''
    form.detailAddress = ''
    form.isDefault = false

    // 清除校验红字
    if (formRef.value) formRef.value.resetFields()

    dialogVisible.value = true
}

const openEdit = (row) => {
    isEdit.value = true
    // 对象拷贝，回显数据
    Object.assign(form, row)
    // 确保回显时 switch 状态正确 (row.isDefault 可能是 boolean 或 0/1，视 loadData 处理而定)
    // 这里因为 loadData 已经转了 boolean，直接赋值即可
    dialogVisible.value = true
}

const handleSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (valid) {
            // 【修改点2】构造提交参数，将 boolean 转为 0/1
            const payload = {
                ...form,
                isDefault: form.isDefault ? 1 : 0
            }

            try {
                if (isEdit.value) {
                    await updateAddress(form.id, payload)
                    ElMessage.success('修改成功')
                } else {
                    await addAddress(payload)
                    ElMessage.success('添加成功')
                }
                dialogVisible.value = false
                loadData()
            } catch (error) {
                console.error(error)
            }
        }
    })
}

const handleDelete = (id) => {
    ElMessageBox.confirm('确定删除该地址吗？', '提示', { type: 'warning' })
        .then(async () => {
            await deleteAddress(id)
            ElMessage.success('删除成功')
            loadData()
        })
        .catch(() => { })
}

const handleSetDefault = async (id) => {
    try {
        await setDefaultAddress(id)
        ElMessage.success('设置成功')
        loadData()
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="container address-page">
        <div class="header">
            <h2>收货地址管理</h2>
            <el-button type="primary" @click="openAdd">新增收货地址</el-button>
        </div>

        <div v-loading="loading" class="address-list">
            <el-table :data="list" style="width: 100%" stripe>
                <el-table-column prop="receiverName" label="收货人" width="120" />
                <el-table-column prop="receiverPhone" label="联系电话" width="150" />
                <el-table-column label="所在地区" width="200">
                    <template #default="{ row }">
                        {{ row.province }} {{ row.city }} {{ row.district }}
                    </template>
                </el-table-column>
                <el-table-column prop="detailAddress" label="详细地址" />
                <el-table-column label="状态" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag v-if="row.isDefault" type="success" size="small">默认地址</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="250" align="center">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
                        <el-button v-if="!row.isDefault" link @click="handleSetDefault(row.id)">
                            设为默认
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑收货地址' : '新增收货地址'" width="500px" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="收货人" prop="receiverName">
                    <el-input v-model="form.receiverName" placeholder="请输入收货人姓名" />
                </el-form-item>
                <el-form-item label="联系电话" prop="receiverPhone">
                    <el-input v-model="form.receiverPhone" placeholder="请输入手机号码" maxlength="11" />
                </el-form-item>
                <el-form-item label="省份" prop="province">
                    <el-input v-model="form.province" placeholder="如：北京市" />
                </el-form-item>
                <el-form-item label="城市" prop="city">
                    <el-input v-model="form.city" placeholder="如：北京市" />
                </el-form-item>
                <el-form-item label="区县" prop="district">
                    <el-input v-model="form.district" placeholder="如：朝阳区" />
                </el-form-item>
                <el-form-item label="详细地址" prop="detailAddress">
                    <el-input v-model="form.detailAddress" type="textarea" placeholder="街道、楼牌号等" />
                </el-form-item>
                <el-form-item label="默认地址" prop="isDefault">
                    <el-switch v-model="form.isDefault" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmit">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.address-page {
    padding: 20px 0;
    background: #fff;
    min-height: 500px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 20px;
}

.address-list {
    padding: 0 20px;
}
</style>