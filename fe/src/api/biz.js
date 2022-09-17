// 这个文件存放所有业务相关的request
import request from '@/utils/request'

const bizApi = {
  TreeView: '/api/treeview',
  ProjectList: '/project',
  APIList: '/api'
}

export function getApiTreeView () {
  return request({
    url: bizApi.TreeView,
    method: 'get'
  })
}
