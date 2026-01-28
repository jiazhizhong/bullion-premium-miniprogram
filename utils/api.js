/**
 * API请求工具
 * 统一处理小程序网络请求
 */

// API基础URL - 根据实际情况修改
const BASE_URL = 'http://localhost:3009/api';

// 标记是否正在重新登录，避免重复请求
let isReLogin = false;

/**
 * 获取存储的token
 */
function getToken() {
  try {
    return wx.getStorageSync('token') || '';
  } catch (e) {
    return '';
  }
}

/**
 * 尝试自动重新登录
 * @returns {Promise<boolean>} - 是否登录成功
 */
async function tryReLogin() {
  // 如果正在重新登录，直接返回false，避免重复请求
  if (isReLogin) {
    return false;
  }

  try {
    isReLogin = true;

    // 获取微信登录code
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });

    if (!loginRes.code) {
      return false;
    }

    // 调用登录接口（使用post方法直接调用，避免循环依赖）
    const result = await post('/wechat/login', {
      code: loginRes.code,
      userInfo: null
    });

    if (result && result.token) {
      // 保存token和用户信息
      wx.setStorageSync('token', result.token);
      wx.setStorageSync('userInfo', {
        id: result.id,
        openid: result.openid,
        nickname: result.nickname,
        avatar: result.avatar,
        phone: result.phone
      });

      // 更新全局数据
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.userInfo = {
          id: result.id,
          openid: result.openid,
          nickname: result.nickname,
          avatar: result.avatar,
          phone: result.phone
        };
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('自动重新登录失败:', error);
    return false;
  } finally {
    isReLogin = false;
  }
}

/**
 * 处理token失效
 * @param {number} errorCode - 错误代码
 * @param {string} errorMessage - 错误消息
 */
async function handleTokenExpired(errorCode, errorMessage) {
  // 清除所有本地存储数据
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('goldAssets');
  wx.removeStorageSync('silverAssets');

  // 更新全局数据
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.userInfo = null;
    app.globalData.assets = {
      gold: [],
      silver: []
    };
  }

  // 尝试自动重新登录
  const reLoginSuccess = await tryReLogin();

  if (!reLoginSuccess) {
    // 自动登录失败，提示用户重新登录
    wx.showModal({
      title: '登录已过期',
      content: '您的登录已过期，请重新登录',
      showCancel: true,
      cancelText: '稍后',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          // 跳转到个人中心页面（登录页面）
          wx.switchTab({
            url: '/pages/profile/profile',
            fail: () => {
              // 如果switchTab失败，尝试navigateTo
              wx.navigateTo({
                url: '/pages/profile/profile',
                fail: () => {
                  console.error('跳转到登录页面失败');
                }
              });
            }
          });
        }
      }
    });
  } else {
    // 自动登录成功，提示用户
    wx.showToast({
      title: '已自动重新登录',
      icon: 'success',
      duration: 2000
    });
  }
}

/**
 * 统一请求方法
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = getToken();
    
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token, // 添加token到请求头
        ...options.header
      },
      success: async (res) => {
        if (res.statusCode === 200) {
          if (res.data.ec === 200) {
            resolve(res.data.data);
          } else {
            // 业务错误
            const error = new Error(res.data.em || '请求失败');
            error.code = res.data.ec;
            
            // 如果是401、403或406，说明token失效，尝试重新登录
            if (res.data.ec === 401 || res.data.ec === 403 || res.data.ec === 406) {
              await handleTokenExpired(res.data.ec, res.data.em);
            }
            
            reject(error);
          }
        } else {
          // HTTP错误
          reject(new Error(`HTTP错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        reject(new Error('网络请求失败，请检查网络连接'));
      }
    });
  });
}

/**
 * GET请求
 */
function get(url, data = {}) {
  return request({
    url: url,
    method: 'GET',
    data: data
  });
}

/**
 * POST请求
 */
function post(url, data = {}) {
  return request({
    url: url,
    method: 'POST',
    data: data
  });
}

/**
 * PUT请求
 */
function put(url, data = {}) {
  return request({
    url: url,
    method: 'PUT',
    data: data
  });
}

/**
 * DELETE请求
 */
function del(url, data = {}) {
  return request({
    url: url,
    method: 'DELETE',
    data: data
  });
}

// ==================== 行情相关接口 ====================

/**
 * 获取实时行情
 */
function getRealtimeMarket() {
  return get('/market/realtime');
}

/**
 * 获取历史价格
 * @param {String} type - gold/silver
 * @param {String} period - day/week/month
 */
function getHistoryPrice(type, period = 'day') {
  return get('/market/history', { type, period });
}

// ==================== 汇率接口 ====================

/**
 * 获取汇率
 */
function getExchangeRate() {
  return get('/exchange-rate');
}

// ==================== 资产相关接口 ====================

/**
 * 获取资产列表
 * @param {String} type - gold/silver，不传则返回全部
 * @param {String} date - 日期筛选（格式：YYYY-MM-DD）
 * @param {String} channel - 渠道筛选
 */
function getAssets(type, date, channel) {
  const params = {};
  if (type) params.type = type;
  if (date) params.date = date;
  if (channel) params.channel = channel;
  return get('/assets', params);
}

/**
 * 添加资产
 * @param {Object} asset - 资产信息
 */
function addAsset(asset) {
  return post('/assets', asset);
}

/**
 * 更新资产
 * @param {String} id - 资产ID
 * @param {Object} data - 更新的数据
 */
function updateAsset(id, data) {
  return put(`/assets/${id}`, data);
}

/**
 * 删除资产
 * @param {String} id - 资产ID
 */
function deleteAsset(id) {
  return del(`/assets/${id}`);
}

// ==================== 价格换算接口 ====================

/**
 * 价格换算
 * @param {Number} usdPrice - 国际价格（美元/盎司）
 * @param {Number} exchangeRate - 汇率，可选
 */
function convertPrice(usdPrice, exchangeRate) {
  return post('/convert', {
    usdPrice,
    exchangeRate
  });
}

// ==================== 溢价计算接口 ====================

/**
 * 计算溢价
 * @param {Number} basePrice - 基准价格
 * @param {Number} buyPrice - 买入价格
 * @param {Number} buyWeight - 买入重量，可选
 */
function calculatePremium(basePrice, buyPrice, buyWeight) {
  return post('/premium/calculate', {
    basePrice,
    buyPrice,
    buyWeight
  });
}

// ==================== 用户相关接口 ====================

/**
 * 微信登录
 * @param {String} code - 微信登录code
 * @param {Object} userInfo - 用户信息（可选）
 */
function wechatLogin(code, userInfo) {
  return post('/wechat/login', {
    code,
    userInfo
  });
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return get('/user/info');
}

/**
 * 检查登录状态
 * @returns {boolean} - 是否已登录
 */
function checkLoginStatus() {
  const token = getToken();
  const userInfo = wx.getStorageSync('userInfo');
  return !!(token && userInfo);
}

/**
 * 提示用户登录
 */
function promptLogin() {
  wx.showModal({
    title: '需要登录',
    content: '此功能需要登录后才能使用，是否前往登录？',
    showCancel: true,
    cancelText: '取消',
    confirmText: '去登录',
    success: (res) => {
      if (res.confirm) {
        // 跳转到个人中心页面（登录页面）
        wx.switchTab({
          url: '/pages/profile/profile',
          fail: () => {
            // 如果switchTab失败，尝试navigateTo
            wx.navigateTo({
              url: '/pages/profile/profile',
              fail: () => {
                console.error('跳转到登录页面失败');
              }
            });
          }
        });
      }
    }
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  getToken,
  checkLoginStatus,
  promptLogin,
  // 行情
  getRealtimeMarket,
  getHistoryPrice,
  // 汇率
  getExchangeRate,
  // 资产
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  // 价格换算
  convertPrice,
  // 溢价计算
  calculatePremium,
  // 用户
  wechatLogin,
  getUserInfo
};
