// pages/assets/assets.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    goldStats: {
      totalWeight: 0,
      totalValue: 0,
      avgPrice: 0,
      profit: 0
    },
    silverStats: {
      totalWeight: 0,
      totalValue: 0,
      avgPrice: 0,
      profit: 0
    },
    loading: false
  },

  onLoad() {
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    this.loadAssets();
  },

  onShow() {
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    // 每次显示时重新加载资产数据
    this.loadAssets();
  },

  // 检查登录状态
  checkLogin() {
    const api = require('../../utils/api');
    if (!api.checkLoginStatus()) {
      api.promptLogin();
      return false;
    }
    return true;
  },

  // 加载资产数据
  async loadAssets() {
    this.setData({ loading: true });
    try {
      // 同时加载资产数据和行情数据
      const [assetsData, marketData] = await Promise.all([
        api.getAssets().catch((err) => {
          console.error('获取资产数据失败:', err);
          return null;
        }),
        api.getRealtimeMarket().catch((err) => {
          console.error('获取行情数据失败:', err);
          return null;
        })
      ]);
      
      console.log('接口返回的资产数据:', assetsData);
      console.log('接口返回的行情数据:', marketData);
      
      // 更新资产数据
      if (assetsData) {
        // 确保数据结构正确
        const goldAssets = Array.isArray(assetsData.gold) ? assetsData.gold : [];
        const silverAssets = Array.isArray(assetsData.silver) ? assetsData.silver : [];
        
        console.log('黄金资产列表:', goldAssets);
        console.log('白银资产列表:', silverAssets);
        
        app.globalData.assets.gold = goldAssets;
        app.globalData.assets.silver = silverAssets;
        app.saveAssetsToStorage();
      } else {
        console.warn('资产数据为空，使用本地存储数据');
        // 如果接口返回为空，尝试从本地存储加载
        app.loadAssetsFromStorage();
      }
      
      // 更新行情数据
      if (marketData) {
        app.globalData.marketData = marketData;
        console.log('行情数据已更新:', marketData);
      }
      
      // 计算统计
      this.calculateStats();
    } catch (error) {
      console.error('加载资产数据失败:', error);
      // 失败时使用本地数据
      app.loadAssetsFromStorage();
      this.calculateStats();
    } finally {
      this.setData({ loading: false });
    }
  },

  // 计算资产统计
  calculateStats() {
    console.log('开始计算统计，当前资产数据:', {
      gold: app.globalData.assets.gold,
      silver: app.globalData.assets.silver
    });
    console.log('当前行情数据:', app.globalData.marketData);
    
    // 确保行情数据存在
    if (!app.globalData.marketData || !app.globalData.marketData.gold || !app.globalData.marketData.silver) {
      console.warn('行情数据未加载，使用默认值');
      // 如果行情数据不存在，使用默认值
      if (!app.globalData.marketData) {
        app.globalData.marketData = {
          gold: { price: 485.20 },
          silver: { price: 6.82 }
        };
      } else {
        if (!app.globalData.marketData.gold) {
          app.globalData.marketData.gold = { price: 485.20 };
        }
        if (!app.globalData.marketData.silver) {
          app.globalData.marketData.silver = { price: 6.82 };
        }
      }
    }
    
    const goldStats = app.calculateAssetsStats('gold');
    const silverStats = app.calculateAssetsStats('silver');
    
    console.log('计算后的黄金统计:', goldStats);
    console.log('计算后的白银统计:', silverStats);
    
    this.setData({
      goldStats: goldStats,
      silverStats: silverStats
    });
    
    console.log('页面数据已更新');
  },

  // 点击黄金资产
  onGoldAssetsTap() {
    wx.navigateTo({
      url: '/pages/assets/gold-list/gold-list'
    });
  },

  // 点击白银资产
  onSilverAssetsTap() {
    wx.navigateTo({
      url: '/pages/assets/silver-list/silver-list'
    });
  },

  // 点击添加资产
  onAddAssetTap() {
    wx.navigateTo({
      url: '/pages/assets/add-asset/add-asset'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      await this.loadAssets();
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
