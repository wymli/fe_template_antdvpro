<template>
  <!-- hidden PageHeaderWrapper title demo -->
  <page-header-wrapper :title="false">
    <a-layout-header class="header">
      <div class="logo" />
      <a-menu
        mode="horizontal"
        :selectedKeys="current_proj_menu"
        style="{ lineHeight: '64px'; border-style: solid;}"
        @click="clickProject"
      >
        <template v-for="projectname in project_name_list">
          <a-menu-item :key="projectname"> {{ projectname }} </a-menu-item>
        </template>
      </a-menu>
    </a-layout-header>
    <a-layout>
      <a-layout-sider width="200" style="background: #fff">
        <a-menu
          mode="inline"
          :selectedKeys="current_api_menu"
          :style="{ height: '100%', borderRight: 0 }"
          @click="clickAPI"
        >
          <template v-for="apiname in api_name_list">
            <a-menu-item :key="apiname"> {{ apiname }} </a-menu-item>
          </template>
        </a-menu>
      </a-layout-sider>
      <a-layout style="padding: 0 24px 24px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item v-if="current_proj_name">{{ current_proj_name }}</a-breadcrumb-item>
          <a-breadcrumb-item v-if="current_api_name">{{ current_api_name }}</a-breadcrumb-item>
        </a-breadcrumb>
        <a-layout-content :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }">
          <div v-if="current_selected_proj_menu === ADD">
            <ProjectCreateForm ref="ProjectCreateForm"></ProjectCreateForm>
          </div>
          <div v-else-if="!current_proj || !current_api"><mark>请先选择一个项目和API，或新建项目、API</mark></div>
          <div v-else>
            <a-tabs v-model="activeTabKey" hide-add type="editable-card" @edit="onEdit">
              <a-tab-pane v-for="pane in panes" :key="pane.key" :tab="pane.title" :closable="pane.closable">
                <RequestForm ref="RequestForm" :initFormData="initForm()" :exampleList="initExampleList()"></RequestForm>
              </a-tab-pane>
            </a-tabs>
            <a-card v-if="activeTabKey === ''">
              暂未选择任何tab
            </a-card>
            <a-card v-else>
            </a-card>
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </page-header-wrapper>
</template>

<script>
// import { getApiTreeView } from '@/api/biz'
import RequestForm from './component/RequestForm'
import ProjectCreateForm from './component/ProjectCreate'
var ADD = '[＋]'
export default {
  name: 'APIBox',
  components: {
    RequestForm,
    ProjectCreateForm
  },
  data () {
    return {
      current_proj_menu: [],
      current_api_menu: [],
      current_api: undefined,
      current_proj: undefined,
      tree: {},
      api_history: {},
      activeTabKey: '',
      panes: [],
      ADD: '[＋]'
    }
  },
  created () {
    this.initTree()
    this.initRoute()
  },
  mounted () {
  },
  computed: {
    currentRequestFormRef () {
      console.log(`current tab ${this.activeTabKey}`)
      // console.log(`current refs: ${JSON.stringify(this.$refs)}`)
      var i = 0
      for (const idx in this.panes) {
        if (this.panes[idx].key === this.activeTabKey) {
          i = idx
          break
        }
      }
      console.log(`active tab index: ${i}`)
      return this.$refs.RequestForm[i]
    },
    project_name_list () {
      return [ADD].concat(Object.keys(this.tree))
    },
    api_name_list () {
      if (!this.current_proj) {
        return []
      }
      if (this.emptyObj(this.current_proj)) {
        return []
      }
      return [ADD].concat(Object.keys(this.current_proj.api_list))
    },
    current_api_name () {
      if (this.emptyObj(this.current_api)) {
        return ''
      }
      return this.current_api.name
    },
    current_proj_name () {
      if (this.emptyObj(this.current_proj)) {
        return ''
      }
      return this.current_proj.name
    },
    current_selected_api_menu () {
      // eslint-disable-next-line eqeqeq
      if (this.current_api_menu == '') {
        return ''
      }
      return this.current_api_menu[0]
    },
    current_selected_proj_menu () {
      // eslint-disable-next-line eqeqeq
      if (this.current_proj_menu == '') {
        return ''
      }
      return this.current_proj_menu[0]
    }
  },
  watch: {
    activeTabKey (val, oldVal) {
      if (val === '') {
        this.setAPIMenu('')
        return
      }

      var res = val.split('/')
      var projectName = res[0]
      var apiName = res[1]

      // eslint-disable-next-line eqeqeq
      if (this.current_proj_menu == projectName) {
        this.setAPIMenu(apiName)
      } else {
        this.setProjMenu(projectName)
        this.setAPIMenu(apiName)
      }
    }
  },
  methods: {
    clickProject (item, key, selectedKeys) {
      const oldProjectName = this.current_proj_name
      const newProjectName = item.key
      if (oldProjectName === newProjectName) {
        return
      }

      // store old project selected api
      this.addAPIHistory(oldProjectName, this.current_api_name)
      // set new project
      this.setProjMenu(newProjectName)
      // set url query
      this.$router.push({
        query: {
          project: newProjectName
        }
      })
      // restore new project selected api
      this.setAPIMenu(this.api_history[newProjectName])
    },
    clickAPI (item, key, selectedKeys) {
      const oldAPIName = this.current_api_name
      const newAPIName = item.key

      if (oldAPIName === newAPIName) {
        return
      }

      console.log(newAPIName + this.current_proj_name)
      if (!this.current_proj_name) {
        this.$message.error('no current project selected')
        return
      }
      // set new api
      this.setAPIMenu(newAPIName)
      // set url query
      this.$router.push({
        query: {
          project: this.current_proj_name,
          api: this.current_api_name
        }
      })
      this.addPane()
    },
    addAPIHistory (projName, apiName) {
      this.api_history[projName] = apiName
    },
    setAPIMenu (apiName) {
      if (apiName) {
        this.current_api_menu = [apiName]
        this.current_api = this.tree[this.current_proj_name].api_list[apiName]
      } else {
        this.current_api_menu = []
        this.current_api = {}
      }
    },
    setProjMenu (projName) {
      if (projName) {
        this.current_proj_menu = [projName]
        this.current_proj = this.tree[projName]
      } else {
        this.current_proj_menu = []
        this.current_proj = {}
      }
    },
    emptyObj (obj) {
      if (!obj) {
        return true
      }
      if (Object.keys(obj) === 0) {
        return true
      }
      return false
    },
    initTree () {
      const { data, msg, code } = this.mock_view()
      // const { data, msg, code } = getApiTreeView()
      if (code !== 0) {
        this.$message.error(msg)
        return
      }

      console.log(data)
      const tree = {}
      data.forEach(function (proj, i) {
        const apiDict = {}
        proj.api_list.forEach(function (api, i) {
          apiDict[api.name] = api
        })
        proj.api_list = apiDict
        tree[proj.name] = proj
      })
      this.tree = tree
      console.log(this.tree)
    },
    mock_view () {
      return {
        'data': [
          {
            name: 'bigbang',
            api_list: [
              {
                name: 'hello'
              },
              {
                name: 'getIndex'
              }
            ]
          },
          {
            name: 'lagx',
            api_list: [
              {
                name: 'hello'
              }
            ]
          }
        ],
        'msg': 'ok',
        'code': 0
      }
    },
    initRoute () {
      const projName = this.$route.query.project
      if (!projName) {
        // this.$message.warning('请选择项目')
        return
      }
      this.setProjMenu(projName)
      console.log('initRoute: set current project ' + JSON.stringify(this.current_proj))
      const apiName = this.$route.query.api
      if (!apiName) {
        return
      }
      this.setAPIMenu(apiName)
      console.log('initRoute: set current api ' + JSON.stringify(this.current_api))
      this.addPane()
    },
    onEdit (targetKey, action) {
      this[action](targetKey)
    },
    addPane () {
      const activeTabKey = `${this.current_proj_name}/${this.current_api_name}`
      this.panes.forEach((pane, i) => {
        if (pane.key === activeTabKey) {
          this.activeTabKey = activeTabKey
        }
      })
      if (this.activeTabKey === activeTabKey) {
        console.log(`switch pane ${activeTabKey}`)
        return
      }
      console.log(`add new pane ${activeTabKey}`)
      this.panes.splice(this.panes.length, 0, {
        title: `${activeTabKey}`,
        content: `Content of new Tab ${activeTabKey}`,
        key: activeTabKey
      })
      this.activeTabKey = activeTabKey

      this.initPane()
    },
    remove (targetKey) {
      let activeTabKey = this.activeTabKey
      let index = 0
      this.panes.forEach((pane, i) => {
        if (pane.key === targetKey) {
          index = i
        }
      })
      if (activeTabKey === targetKey) {
        console.log(`kill active pane: ${activeTabKey}`)
        activeTabKey = ''
      }
      this.panes.splice(index, 1)
      this.activeTabKey = activeTabKey
    },
    initPane () {
      // this.initForm()
      // setTimeout(() => {
      //   console.log(`refs: ${JSON.stringify(this.$refs)}`)
      // }, 1000)
    },
    initForm () {
      return {
          uri: '/',
          method: 'GET',
          schema: 'sd',
          endpoint: 'data.byteair.trainer',
          params: { 'a': '1' }
        }
    },
    initExampleList () {
      return [
        {
          uri: '/',
          method: 'GET',
          schema: 'sd',
          endpoint: 'data.byteair.trainer',
          params: { 'a': '1' }
        },
        { uri: '/',
          method: 'GET',
          schema: 'sd',
          endpoint: 'data.byteair.trainer',
          params: { 'b': '2' }
        }
      ]
    }
  }
}
</script>
