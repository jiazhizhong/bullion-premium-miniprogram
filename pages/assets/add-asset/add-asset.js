// pages/assets/add-asset/add-asset.js
const app = getApp();
const api = require('../../../utils/api');

Page({
  data: {
    assetType: 'gold',
    channelIndex: 0,
    channels: [
      { name: '银行柜台' },
      { name: '网上银行' },
      { name: '手机银行' },
      { name: '第三方平台' },
      { name: '其他' }
    ],
    formData: {
      price: '',
      weight: '',
      channel: '',
      date: ''
    },
    // 编辑模式相关
    isEditMode: false,
    assetId: null,
    originalType: 'gold'
  },

  onLoad(options) {
    // 检查登录状态
    const api = require('../../../utils/api');
    if (!api.checkLoginStatus()) {
      api.promptLogin();
      // 延迟返回上一页，让用户看到提示
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
      return;
    }

    // 检查是否是编辑模式
    if (options.id) {
      this.setData({
        isEditMode: true,
        assetId: options.id,
        assetType: options.type || 'gold',
        originalType: options.type || 'gold'
      });
      // 加载资产数据
      this.loadAssetData(options.id);
    } else {
      // 添加模式，设置默认日期为今天
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      this.setData({
        'formData.date': dateStr
      });
    }
  },

  // 加载资产数据（编辑模式）
  async loadAssetData(assetId) {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      // 从全局数据获取资产数据
      const goldAssets = app.globalData.assets.gold || [];
      const silverAssets = app.globalData.assets.silver || [];
      const allAssets = goldAssets.concat(silverAssets);
      let asset = allAssets.find(item => item.id && item.id.toString() === assetId.toString());

      if (!asset) {
        // 如果本地没有，尝试从API获取
        try {
          const assetsData = await api.getAssets();
          const apiAssets = (assetsData.gold || []).concat(assetsData.silver || []);
          asset = apiAssets.find(item => item.id && item.id.toString() === assetId.toString());
        } catch (apiError) {
          console.error('从API获取资产失败:', apiError);
        }
      }

      if (asset) {
        // 找到对应的渠道索引
        const channelIndex = this.data.channels.findIndex(ch => ch.name === asset.channel);
        
        // 格式化日期（去掉时间部分）
        let dateStr = asset.date || asset.purchase_date || '';
        if (dateStr) {
          if (dateStr.indexOf('T') > 0) {
            dateStr = dateStr.split('T')[0];
          } else if (dateStr.indexOf(' ') > 0) {
            dateStr = dateStr.split(' ')[0];
          }
        }

        this.setData({
          assetType: asset.type,
          channelIndex: channelIndex >= 0 ? channelIndex : 0,
          formData: {
            price: asset.price ? asset.price.toString() : '',
            weight: asset.weight ? asset.weight.toString() : '',
            channel: asset.channel || '其他',
            date: dateStr
          }
        });
      } else {
        throw new Error('资产不存在');
      }

      wx.hideLoading();
    } catch (error) {
      console.error('加载资产数据失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      // 加载失败，返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 切换资产类型（编辑模式下禁用）
  onTypeChange(e) {
    if (this.data.isEditMode) {
      return; // 编辑模式下不允许修改资产类型
    }
    const type = e.currentTarget.dataset.type;
    this.setData({
      assetType: type
    });
  },

  // 价格输入
  onPriceInput(e) {
    this.setData({
      'formData.price': e.detail.value
    });
  },

  // 克数输入
  onWeightInput(e) {
    this.setData({
      'formData.weight': e.detail.value
    });
  },

  // 渠道选择
  onChannelChange(e) {
    const index = e.detail.value;
    const channel = this.data.channels[index].name;
    this.setData({
      channelIndex: index,
      'formData.channel': channel
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    });
  },

  // 提交
  async onSubmit() {
    const { assetType, formData, isEditMode, assetId } = this.data;
    
    if (!formData.price || !formData.weight) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const assetData = {
      price: parseFloat(formData.price),
      weight: parseFloat(formData.weight),
      channel: formData.channel || '其他',
      date: formData.date
    };

    try {
      wx.showLoading({
        title: isEditMode ? '更新中...' : '添加中...',
        mask: true
      });

      let result;
      if (isEditMode) {
        // 编辑模式：调用更新接口
        result = await api.updateAsset(assetId, assetData);
        
        // 更新本地数据
        const updatedAsset = app.updateAsset(assetId, assetType, {
          ...assetData,
          totalValue: (assetData.price * assetData.weight).toFixed(2)
        });
        
        // 如果更新成功，同步到全局数据
        if (updatedAsset && result) {
          // 确保数据同步
          const assets = app.globalData.assets[assetType];
          const index = assets.findIndex(item => item.id && item.id.toString() === assetId.toString());
          if (index >= 0 && result) {
            assets[index] = {
              ...assets[index],
              ...result,
              totalValue: (result.price * result.weight).toFixed(2)
            };
            app.saveAssetsToStorage();
          }
        }
      } else {
        // 添加模式：调用添加接口
        const asset = {
          type: assetType,
          ...assetData
        };
        result = await api.addAsset(asset);
        
        // 更新本地数据
        if (result) {
          app.addAsset(result);
        }
      }
      
      wx.hideLoading();
      wx.showToast({
        title: isEditMode ? '更新成功' : '添加成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error(isEditMode ? '更新资产失败:' : '添加资产失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: isEditMode ? '更新失败' : '添加失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 刷新行情数据（用于显示参考价格）
      const api = require('../../../utils/api');
      const marketData = await api.getRealtimeMarket();
      if (marketData) {
        app.globalData.marketData = marketData;
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
