// pages/profile/profile.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
    } else {
      this.setData({
        userInfo: null,
        isLoggedIn: false
      });
    }
  },

  // 微信登录
  async onLoginTap() {
    try {
      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      // 1. 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        throw new Error('获取登录code失败');
      }

      // 2. 获取用户信息（可选）
      let userInfo = null;
      try {
        const userInfoRes = await new Promise((resolve, reject) => {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: reject
          });
        });
        userInfo = userInfoRes.userInfo;
      } catch (e) {
        console.log('用户拒绝授权，使用基础登录');
      }

      // 3. 调用登录接口
      const result = await api.wechatLogin(loginRes.code, userInfo);

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
        app.globalData.userInfo = {
          id: result.id,
          openid: result.openid,
          nickname: result.nickname,
          avatar: result.avatar,
          phone: result.phone
        };

        // 更新页面数据
        this.setData({
          userInfo: app.globalData.userInfo,
          isLoggedIn: true
        });

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      } else {
        throw new Error('登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 退出登录
  onLogoutTap() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除所有本地存储数据
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('goldAssets');
          wx.removeStorageSync('silverAssets');
          
          // 清除全局数据
          app.globalData.userInfo = null;
          app.globalData.assets = {
            gold: [],
            silver: []
          };
          
          // 更新页面数据
          this.setData({
            userInfo: null,
            isLoggedIn: false
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 点击价格换算
  onConvertTap() {
    wx.navigateTo({
      url: '/pages/convert/convert'
    });
  },

  // 点击溢价信息
  onPremiumTap() {
    wx.navigateTo({
      url: '/pages/premium/premium'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 刷新用户信息
      this.loadUserInfo();
      
      // 如果已登录，尝试从服务器获取最新用户信息
      if (this.data.isLoggedIn) {
        try {
          const userInfo = await api.getUserInfo();
          if (userInfo) {
            wx.setStorageSync('userInfo', userInfo);
            app.globalData.userInfo = userInfo;
            this.setData({
              userInfo: userInfo,
              isLoggedIn: true
            });
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
