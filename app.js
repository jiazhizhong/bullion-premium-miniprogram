// app.js
const api = require('./utils/api');

App({
  onLaunch() {
    // 初始化应用
    this.initApp();
  },

  onShow() {
    // 应用显示时
  },

  onHide() {
    // 应用隐藏时
  },

  async initApp() {
    // 初始化数据
    this.globalData = {
      // 实时行情数据
      marketData: {
        gold: {
          price: 485.20,
          change: 2.45,
          changePercent: 2.45
        },
        silver: {
          price: 6.82,
          change: 0.08,
          changePercent: 1.23
        }
      },
      // 汇率
      exchangeRate: 7.2,
      // 用户资产
      assets: {
        gold: [],
        silver: []
      },
      // 当前选中的Tab
      currentTab: 0,
      // 用户信息
      userInfo: null
    };

    // 检查登录状态
    await this.checkLogin();
    
    // 从API加载初始数据
    await this.loadInitialData();
    
    // 加载本地存储的资产数据（如果API失败则使用本地数据）
    this.loadAssetsFromStorage();
  },

  // 检查登录状态
  async checkLogin() {
    try {
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (token && userInfo) {
        this.globalData.userInfo = userInfo;
        // 可以在这里验证token是否有效
      } else {
        // 如果没有token，尝试自动登录
        await this.autoLogin();
      }
    } catch (e) {
      console.error('检查登录状态失败:', e);
    }
  },

  // 自动登录
  async autoLogin() {
    try {
      const api = require('./utils/api');
      
      // 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });
      
      if (loginRes.code) {
        // 调用登录接口
        const result = await api.wechatLogin(loginRes.code);
        
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
          
          this.globalData.userInfo = {
            id: result.id,
            openid: result.openid,
            nickname: result.nickname,
            avatar: result.avatar,
            phone: result.phone
          };
        }
      }
    } catch (e) {
      console.error('自动登录失败:', e);
      // 自动登录失败不影响应用启动
    }
  },

  // 从API加载初始数据
  async loadInitialData() {
    try {
      // 加载实时行情
      const marketData = await api.getRealtimeMarket();
      if (marketData) {
        this.globalData.marketData = marketData;
      }

      // 加载汇率
      const exchangeData = await api.getExchangeRate();
      if (exchangeData && exchangeData.rate) {
        this.globalData.exchangeRate = exchangeData.rate;
      }

      // 加载资产列表
      const assetsData = await api.getAssets();
      if (assetsData) {
        this.globalData.assets.gold = assetsData.gold || [];
        this.globalData.assets.silver = assetsData.silver || [];
        this.saveAssetsToStorage();
      }
    } catch (error) {
      console.error('加载初始数据失败:', error);
      // 失败时使用默认数据，不影响应用启动
    }
  },

  // 从本地存储加载资产数据
  loadAssetsFromStorage() {
    try {
      const goldAssets = wx.getStorageSync('goldAssets') || [];
      const silverAssets = wx.getStorageSync('silverAssets') || [];
      this.globalData.assets.gold = goldAssets;
      this.globalData.assets.silver = silverAssets;
    } catch (e) {
      console.error('加载资产数据失败', e);
    }
  },

  // 保存资产数据到本地存储
  saveAssetsToStorage() {
    try {
      wx.setStorageSync('goldAssets', this.globalData.assets.gold);
      wx.setStorageSync('silverAssets', this.globalData.assets.silver);
    } catch (e) {
      console.error('保存资产数据失败', e);
    }
  },

  // 添加资产
  addAsset(asset) {
    const type = asset.type; // 'gold' or 'silver'
    this.globalData.assets[type].push({
      ...asset,
      id: Date.now().toString()
    });
    this.saveAssetsToStorage();
    return this.globalData.assets[type];
  },

  // 更新资产
  updateAsset(assetId, type, newData) {
    const assets = this.globalData.assets[type];
    const index = assets.findIndex(item => item.id === assetId);
    if (index !== -1) {
      assets[index] = { ...assets[index], ...newData };
      this.saveAssetsToStorage();
      return assets[index];
    }
    return null;
  },

  // 删除资产
  deleteAsset(assetId, type) {
    const assets = this.globalData.assets[type];
    const index = assets.findIndex(item => item.id === assetId);
    if (index !== -1) {
      assets.splice(index, 1);
      this.saveAssetsToStorage();
      return true;
    }
    return false;
  },

  // 计算资产统计
  calculateAssetsStats(type) {
    const assets = this.globalData.assets[type] || [];
    
    console.log(`计算${type}统计，资产数量:`, assets.length);
    console.log(`资产列表:`, assets);
    
    // 获取当前价格，如果不存在则使用默认值
    let currentPrice = 0;
    if (type === 'gold') {
      currentPrice = this.globalData.marketData?.gold?.price || 485.20;
    } else {
      currentPrice = this.globalData.marketData?.silver?.price || 6.82;
    }
    
    console.log(`当前${type}价格:`, currentPrice);

    let totalWeight = 0;
    let totalCost = 0;

    if (assets && assets.length > 0) {
      assets.forEach((asset, index) => {
        const weight = parseFloat(asset.weight) || 0;
        const price = parseFloat(asset.price) || 0;
        console.log(`资产${index + 1}: 价格=${price}, 重量=${weight}, 成本=${price * weight}`);
        totalWeight += weight;
        totalCost += price * weight;
      });
    }

    const avgPrice = totalWeight > 0 ? totalCost / totalWeight : 0;
    const totalValue = totalWeight * currentPrice;
    const profit = totalValue - totalCost;

    const result = {
      totalWeight: totalWeight || 0,
      totalValue: totalValue || 0,
      avgPrice: avgPrice || 0,
      profit: profit || 0
    };
    
    console.log(`${type}统计结果:`, result);
    
    return result;
  },

  globalData: {
    marketData: {},
    exchangeRate: 7.2,
    assets: {
      gold: [],
      silver: []
    },
    currentTab: 0
  }
});
