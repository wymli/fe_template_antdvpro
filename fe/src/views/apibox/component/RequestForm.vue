<template>
  <div>
    <a-card>
      <a-form-model
        ref="ruleForm"
        :model="requestForm"
        :rules="rules"
        class="form"
      >
        <a-row class="form-row" :gutter="16">
          <a-col :span="8">
            <a-form-model-item label="URI" prop="uri">
              <a-input
                placeholder="形如 /api/v1/hello"
                v-model="requestForm.uri"
              >
                <a-select slot="addonBefore" style="width: 80px; color: #1B9CFC" v-model="requestForm.method">
                  <a-select-option value="GET">GET</a-select-option>
                  <a-select-option value="POST">POST</a-select-option>
                </a-select>
              </a-input>
            </a-form-model-item>
          </a-col>
          <a-col :span="15">
            <a-form-model-item label="Endpoint" prop="endpoint">
              <a-input-group compact>
                <a-tooltip :title="requestForm.schema == 'sd' ? `PSM=${requestForm.endpoint}` : `IP:PORT=${requestForm.endpoint}`">
                  <a-input
                    placeholder="形如 data.byteair.trainer 或 10.197.1.1:9876"
                    style="width: 70%"
                    v-model="requestForm.endpoint"
                  >
                    <a-select
                      slot="addonBefore"
                      v-model="requestForm.schema"
                      style="width: 75px"
                    >
                      <a-select-option value="sd">
                        sd://
                      </a-select-option>
                      <a-select-option value="http">
                        http://
                      </a-select-option>
                    </a-select>
                  </a-input>
                </a-tooltip>
                <a-input
                  style=" width: 80px; border-left: 0; pointer-events: none; backgroundColor: #fff"
                  placeholder="@Lane="
                  disabled
                />
                <a-tooltip :title="`Lane=${requestForm.lane}`">
                  <a-input
                    placeholder="请输入泳道名"
                    v-model="requestForm.lane"
                    style="border-left: 0; width: 120px"
                  >
                  </a-input>
                </a-tooltip>
              </a-input-group>
            </a-form-model-item>
          </a-col>
          <a-col :span="1">
            <a-button @click="handleSubmit" value="large" style="margin-top: 100%;" type="primary" shape="circle" ><a-icon type="search" /></a-button>
          </a-col>
        </a-row>
        <a-row class="form-row" :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="Params"
              :required="false"
            >
              <JsonEditorVue v-model="requestForm.params" v-bind="{/* local props & attrs */}" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-card>
              <div slot="extra">
                <a-button type="link" @click="showExample = !showExample">example</a-button>
                <a-button type="link" @click="showCURL = !showCURL">cURL</a-button>
                <a-button type="link" @click="copyRequstFormOneline">copyOneline</a-button>
                <a-button type="link" @click="copyRequstFormMultiline">copyMultiline</a-button>
                <a-button type="link" @click="showShare = !showShare">share</a-button>
              </div>
              <code> <pre>{{ JSON.stringify(requestForm, null, 2) }}</pre> </code>
            </a-card>
          </a-col>
        </a-row>
      </a-form-model>
    </a-card>
    <div>
      <a-modal
        v-model="showCURL"
        title="cURL generated"
        @ok="copyAndCloseCURL"
        :cancel-button-props="{ style: { display: 'none' } }"
        okText="Copy and Close"
      >
        <a-textarea :value="this.generateCURL()"> </a-textarea>
      </a-modal>
      <a-modal
        v-model="showExample"
        title="Example List"
        :cancel-button-props="{ style: { display: 'none' } }"
        :ok-button-props="{ style: { display: 'none' } }"
      >
        <a-card v-for="(example, idx) in exampleList" :key="idx">
          <a-col :span="20">
            <code> <pre>{{ JSON.stringify(example, null, 2) }}</pre> </code>
          </a-col>
          <a-col :span="4">
            <a-button type="primary" shape="circle" @click="useExample(example)">Use</a-button>
          </a-col>
        </a-card>
      </a-modal>
      <a-modal
        v-model="showShare"
        title="shareURL generated"
        @ok="copyAndCloseShare"
        :ok-button-props="{ props: { disabled: shareGeneraing } }"
        :cancel-button-props="{ style: { display: 'none' } }"
        okText="Copy and Close"
      >
        <a-spin :spinning="shareGeneraing">
          <a-textarea :value="this.generateShare()"> </a-textarea>
        </a-spin>
      </a-modal>
    </div>
    <a-card title="Result" style="margin-top:16px" id="result">
      <code> 结果 </code>
    </a-card>
  </div>
</template>

<script>
export default {
  name: 'RequestForm',
  props: {
    initFormData: {
      type: Object,
      default: function () {
        return {}
      }
    },
    exampleList: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  data () {
    return {
      submitLoading: false,
      requestForm: {
        uri: '',
        method: 'GET',
        schema: 'sd',
        endpoint: '',
        lane: 'None',
        params: {}
      },
      rules: {
        uri: [
          { validator: this.validateURI, trigger: 'change' }
        ],
        endpoint: [
          { validator: this.validateEndpoint, trigger: 'change' }
        ]
      },
      showCURL: false,
      showExample: false,
      showShare: false,
      shareGeneraing: false
    }
  },
  computed: {
  },
  mounted () {
    this.requestForm = { ...this.requestForm, ...this.initFormData }
  },
  methods: {
    handleSubmit (e) {
      this.$refs['ruleForm'].validate(valid => {
        if (!valid) {
          this.$message.error('form not valid')
          return
        }
        this.$message.info('submitted')
        var dd = document.querySelector('#result')
        dd.scrollIntoView()
      })
    },
    validateEndpoint (rule, value, callback) {
      const schema = this.requestForm.schema
      if (!schema) {
        callback(new Error('请选择 schema, 如http、sd'))
        return
      }

      if (schema === 'http') {
        const regex = /^(\d*)\.(\d*)\.(\d*)\.(\d*):\d+$/
        if (!regex.test(value)) {
          callback(new Error('schema==http, 需要形如 10.1.1.1:9876'))
          return
        }
      } else if (schema === 'sd') {
        const regex = /^(.+)\.(.+)\.(.+)$/
        if (!regex.test(value)) {
          callback(new Error('schema==sd, 需要形如 data.byteair.trainer'))
          return
        }
      }

      const lane = this.requestForm.lane
      if (!lane) {
        callback(new Error('请输入 Lane'))
        return
      }

      callback()
    },
    validateURI (rule, value, callback) {
      if (value === '') {
        callback(new Error('请输入 URI'))
        return
      }

      const regex = /^\/.*$/
      if (!regex.test(value)) {
        callback(new Error('URI 需要形如 /api/v1/hello'))
        return
      }

      callback()
    },
    generateCURL () {
      var domain = ''
      var lane = ''
      if (this.requestForm.schema === 'http' || this.requestForm.lane === 'None') {
        lane = '{'
      } else {
        lane = this.requestForm.lane
      }

      if (this.requestForm.schema === 'sd') {
        domain = `$( sd lookup ${this.requestForm.endpoint} | grep '${lane}' | head -n1 | awk '{print $1":"$2}' )`
      } else if (this.requestForm.schema === 'http') {
        domain = this.requestForm.endpoint
      } else {
        throw Error('unknown schema')
      }

      var query = ''
      if (this.requestForm.method === 'GET') {
        var queryItems = []
        for (var key in this.requestForm.params) {
          queryItems.push(`${key}=${this.requestForm.params[key]}`)
        }
        query = '?' + queryItems.join('&')
      }

      var jsonBody = ''
      var header = ' '
      if (this.requestForm.method === 'POST') {
        jsonBody = ` -d '${JSON.stringify(this.requestForm.params)}'`
        header = ' -H "Content-Type: application/json" '
      }

      var curl = `curl -X${this.requestForm.method.toUpperCase()}${header}"http://${domain}${this.requestForm.uri}${query}"${jsonBody}`

      return curl
    },
    generateShare () {
      // 生成短链
      this.shareGeneraing = true
      // this.shareGeneraing = false
      return '12345'
    },
    copyAndCloseCURL (e) {
      navigator.clipboard.writeText(e.currentTarget.parentElement.parentElement.previousElementSibling.firstElementChild.value)
      this.$message.info('copied')
      this.showCURL = !this.showCURL
    },
    useExample (example) {
      this.requestForm = Object.assign({}, example)
      this.$message.info('overrided')
      this.showExample = !this.showExample
    },
    copyRequstFormOneline () {
      navigator.clipboard.writeText(JSON.stringify(this.requestForm))
      this.$message.info('copied')
    },
    copyRequstFormMultiline () {
      navigator.clipboard.writeText(JSON.stringify(this.requestForm, null, 2))
      this.$message.info('copied')
    },
    copyAndCloseShare (e) {
      navigator.clipboard.writeText(e.currentTarget.parentElement.parentElement.previousElementSibling.firstElementChild.value)
      this.$message.info('copied')
      this.showShare = !this.showShare
    }
  }
}
</script>

<style scoped>

</style>
