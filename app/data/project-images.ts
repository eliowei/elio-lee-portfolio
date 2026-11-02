// 由 scratchpad/fetch_images.py 從 elioflowra.com 複製（原始 PNG / JPEG，未轉檔）。
// 顯示時由 @nuxt/image 轉成 AVIF / WebP 並依版面輸出多種尺寸；這裡的寬高是原始像素，讓 <img> 先保留版面空間（避免 CLS）。
export interface ProjectImage { src: string; w: number; h: number; caption?: string }

export const projectImages: Record<string, { cover: ProjectImage; gallery: ProjectImage[] }> = {
  "tokyo-travel-site": {
    "cover": {
      "src": "/images/projects/tokyo-travel-site/cover.png",
      "w": 1437,
      "h": 788
    },
    "gallery": [
      {
        "src": "/images/projects/tokyo-travel-site/04.png",
        "w": 475,
        "h": 788,
        "caption": "首頁：封面、天氣與當日行程"
      },
      {
        "src": "/images/projects/tokyo-travel-site/06.png",
        "w": 475,
        "h": 788,
        "caption": "行程詳情：交通、地圖與景點資訊"
      },
      {
        "src": "/images/projects/tokyo-travel-site/07.png",
        "w": 475,
        "h": 788,
        "caption": "旅遊資訊：即時資訊與行前準備"
      },
      {
        "src": "/images/projects/tokyo-travel-site/03.png",
        "w": 475,
        "h": 863,
        "caption": "旅遊資訊：行李清單"
      },
      {
        "src": "/images/projects/tokyo-travel-site/08.png",
        "w": 475,
        "h": 788,
        "caption": "旅遊資訊：迪士尼樂園規劃（示意資料）"
      },
      {
        "src": "/images/projects/tokyo-travel-site/09.png",
        "w": 475,
        "h": 788,
        "caption": "旅遊資訊：迪士尼行程地圖（示意資料）"
      },
      {
        "src": "/images/projects/tokyo-travel-site/02.png",
        "w": 475,
        "h": 863,
        "caption": "AI 旅遊助手"
      },
      {
        "src": "/images/projects/tokyo-travel-site/01.png",
        "w": 475,
        "h": 863,
        "caption": "花費紀錄（示意資料）"
      }
    ]
  },
  "game-together": {
    "cover": {
      "src": "/images/projects/game-together/cover.png",
      "w": 1321,
      "h": 667
    },
    "gallery": [
      {
        "src": "/images/projects/game-together/01.png",
        "w": 1317,
        "h": 737,
        "caption": "揪團首頁"
      },
      {
        "src": "/images/projects/game-together/02.png",
        "w": 1307,
        "h": 731,
        "caption": "搜尋功能"
      },
      {
        "src": "/images/projects/game-together/03.png",
        "w": 1316,
        "h": 738,
        "caption": "揪團詳情"
      },
      {
        "src": "/images/projects/game-together/04.png",
        "w": 1321,
        "h": 738,
        "caption": "聊天室"
      },
      {
        "src": "/images/projects/game-together/05.png",
        "w": 1912,
        "h": 868,
        "caption": "主辦揪團管理"
      },
      {
        "src": "/images/projects/game-together/06.png",
        "w": 1913,
        "h": 866,
        "caption": "個人資料管理"
      }
    ]
  },
  "personal-portfolio": {
    "cover": {
      "src": "/images/projects/personal-portfolio/cover.png",
      "w": 1904,
      "h": 866
    },
    "gallery": [
      {
        "src": "/images/projects/personal-portfolio/01.png",
        "w": 1904,
        "h": 866,
        "caption": "首頁 Hero"
      },
      {
        "src": "/images/projects/personal-portfolio/02.png",
        "w": 1327,
        "h": 835,
        "caption": "Case Study 列表"
      },
      {
        "src": "/images/projects/personal-portfolio/03.png",
        "w": 1327,
        "h": 842,
        "caption": "作品詳情"
      }
    ]
  },
  "line-oa-platform": {
    "cover": {
      "src": "/images/projects/line-oa-platform/cover.jpg",
      "w": 648,
      "h": 521
    },
    "gallery": [
      {
        "src": "/images/projects/line-oa-platform/01.jpg",
        "w": 1179,
        "h": 2328,
        "caption": "LINE 官方帳號首頁"
      },
      {
        "src": "/images/projects/line-oa-platform/02.png",
        "w": 1536,
        "h": 884,
        "caption": "系統資訊總覽"
      },
      {
        "src": "/images/projects/line-oa-platform/03.png",
        "w": 1912,
        "h": 863,
        "caption": "貓咪管理"
      },
      {
        "src": "/images/projects/line-oa-platform/04.png",
        "w": 1914,
        "h": 1027,
        "caption": "公告管理"
      }
    ]
  },
  "weather-bike-bot": {
    "cover": {
      "src": "/images/projects/weather-bike-bot/cover.png",
      "w": 422,
      "h": 236
    },
    "gallery": [
      {
        "src": "/images/projects/weather-bike-bot/01.png",
        "w": 1179,
        "h": 2317,
        "caption": "功能選單"
      },
      {
        "src": "/images/projects/weather-bike-bot/02.png",
        "w": 1179,
        "h": 551,
        "caption": "YouBike 查詢"
      },
      {
        "src": "/images/projects/weather-bike-bot/03.png",
        "w": 1179,
        "h": 1860,
        "caption": "YouBike 位置分享查詢"
      },
      {
        "src": "/images/projects/weather-bike-bot/04.png",
        "w": 1178,
        "h": 322,
        "caption": "天氣預報"
      },
      {
        "src": "/images/projects/weather-bike-bot/05.png",
        "w": 1174,
        "h": 1095,
        "caption": "天氣預報查詢"
      }
    ]
  }
}
