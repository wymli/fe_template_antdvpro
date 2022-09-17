<template>
  <!-- hidden PageHeaderWrapper title demo -->
  <page-header-wrapper :title="false" content="创建新API">
    <a-card>
      <a-form-model
        ref="ruleForm"
        :model="form"
        :rules="rules"
        class="form"
      >
        <a-form-model-item label="Name" prop="name">
          <a-input v-model="form.name"></a-input>
        </a-form-model-item>
        <a-form-model-item label="URI" prop="uri">
          <a-input v-model="form.uri"></a-input>
        </a-form-model-item>
        <a-form-model-item label="Creator">
          <a-input v-model="form.creator" disabled></a-input>
        </a-form-model-item>
        <a-form-model-item>
          <a-button @click="handleSubmit"> Create </a-button>
        </a-form-model-item>
      </a-form-model>
    </a-card>
  </page-header-wrapper>
</template>

<script>
export default {
  name: 'APICreateForm',
  data () {
    return {
      form: {
        name: '',
        psm: '',
        creator: this.$store.getters.userInfo.name
      },
      rules: {
        name: [
          { validator: this.validateName, trigger: 'blur' }
        ],
        uri: [
          { validator: this.validateURI, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    // handler
    handleSubmit (e) {
      this.form.validateFields((err, values) => {
        if (err) {
          this.$message.error('invalid form')
          return
        }

        console.log(this.apiCreateForm)
      })
    },
    validateName (rule, value, callback) {
      if (!value) {
        callback(new Error('请输入 Name'))
        return
      }

      callback()
    },
    validateURI (rule, value, callback) {
      if (!value) {
        callback(new Error('请输入 URI'))
        return
      }

      const regex = /^\/.*$/
      if (!regex.test(value)) {
        callback(new Error('URI 需要形如 /api/v1/hello'))
        return
      }

      callback()
    }
  }
}
</script>
