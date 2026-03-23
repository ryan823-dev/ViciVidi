/**
 * 行业名录数据源配置
 *
 * 包含全球各国的企业名录、政府采购、B2B平台等数据源
 * 按地区和类型分类组织
 */

import type { DirectorySource } from './directory';

/**
 * 预配置的权威名录数据源
 *
 * 分类说明：
 * - government: 政府官方数据源（如公司注册处、采购平台）
 * - association: 行业协会会员名录
 * - b2b_platform: B2B 商业平台
 * - trade_show: 展会参展商列表
 * - trade_data: 贸易数据平台
 * - custom: 自定义数据源
 */
export const DIRECTORY_SOURCES: DirectorySource[] = [
  // ==================== 全球覆盖 ====================
  {
    id: 'global-opencorporates',
    name: 'OpenCorporates',
    type: 'government',
    url: 'https://opencorporates.com',
    country: 'GLOBAL',
    description: '全球最大开放企业数据库，覆盖2.35亿家公司，免费API访问',
  },
  {
    id: 'global-ted',
    name: 'TED - EU Tenders Electronic Daily',
    type: 'government',
    url: 'https://ted.europa.eu',
    country: 'EU',
    description: '欧盟政府采购公告API，包含所有EU成员国采购商信息',
  },
  {
    id: 'global-us-census',
    name: 'US Census International Trade API',
    type: 'government',
    url: 'https://api.census.gov/data/international-trade',
    country: 'US',
    description: '美国人口普查局国际贸易数据，免费API，包含进出口商信息',
  },

  // ==================== 美国 ====================
  {
    id: 'usa-sba',
    name: 'US SBA Business Directory',
    type: 'government',
    url: 'https://www.sba.gov/business-guide/launch-your-business/find-business-name',
    country: 'US',
    description: '美国小企业管理局企业名录',
  },
  {
    id: 'usa-thomasnet',
    name: 'ThomasNet',
    type: 'b2b_platform',
    url: 'https://www.thomasnet.com',
    country: 'US',
    industry: 'Manufacturing',
    description: '北美工业制造商目录',
  },
  {
    id: 'usa-naics',
    name: 'US Census NAICS Codes',
    type: 'government',
    url: 'https://www.census.gov/naics',
    country: 'US',
    description: '北美行业分类系统，查找特定行业公司',
  },
  {
    id: 'us-sam',
    name: 'SAM.gov - US Federal Procurement',
    type: 'government',
    url: 'https://sam.gov',
    country: 'US',
    description: '美国联邦政府采购系统，包含所有政府采购机会',
  },

  // ==================== 欧盟 ====================
  {
    id: 'eu-boamp',
    name: 'BOAMP - France Public Procurement',
    type: 'government',
    url: 'https://www.boamp.fr',
    country: 'FR',
    description: '法国政府采购公告',
  },
  {
    id: 'eu-subasta',
    name: 'Germany Subasta',
    type: 'government',
    url: 'https://www.subasta.de',
    country: 'DE',
    description: '德国政府采购平台',
  },
  {
    id: 'eu-anticorruzione',
    name: 'Italy ANAC',
    type: 'government',
    url: 'https://www.anticorruzione.it',
    country: 'IT',
    description: '意大利国家反腐败局采购数据',
  },

  // ==================== 德国 ====================
  {
    id: 'de-gtai',
    name: 'Germany Trade & Invest',
    type: 'association',
    url: 'https://www.gtai.com/en',
    country: 'DE',
    description: '德国贸易投资名录',
  },
  {
    id: 'de-vdma',
    name: 'VDMA - Mechanical Engineering',
    type: 'association',
    url: 'https://www.vdma.org',
    country: 'DE',
    industry: 'Machinery',
    description: '德国机械工程协会',
  },
  {
    id: 'de-hoppenstedt',
    name: 'Hoppenstedt Company Database',
    type: 'b2b_platform',
    url: 'https://www.hoppenstedt.de',
    country: 'DE',
    description: '德国企业数据库',
  },

  // ==================== 英国 ====================
  {
    id: 'uk-companies-house',
    name: 'UK Companies House',
    type: 'government',
    url: 'https://find-and-update.company-information.service.gov.uk',
    country: 'UK',
    description: '英国公司注册处，提供免费公司信息查询',
  },
  {
    id: 'uk-eca',
    name: 'ECA Directory',
    type: 'association',
    url: 'https://www.eca.co.uk',
    country: 'UK',
    industry: 'Electrical',
    description: '英国电气承包商协会',
  },

  // ==================== 日本 ====================
  {
    id: 'jp-jamea',
    name: 'JAMEA Directory',
    type: 'association',
    url: 'https://www.jamea.or.jp',
    country: 'JP',
    industry: 'Machinery',
    description: '日本工作机械工业会',
  },
  {
    id: 'jp-tdb',
    name: 'Tokyo Shoko Research',
    type: 'b2b_platform',
    url: 'https://www.tsr.co.jp',
    country: 'JP',
    description: '东京商工研究，日本最大企业数据库',
  },

  // ==================== 中国 ====================
  {
    id: 'cn-ccpit',
    name: 'CCPIT',
    type: 'association',
    url: 'https://www.ccpit.org',
    country: 'CN',
    description: '中国国际贸易促进委员会',
  },
  {
    id: 'cn-qichacha',
    name: '企查查',
    type: 'b2b_platform',
    url: 'https://www.qcc.com',
    country: 'CN',
    description: '中国企业信息查询平台',
  },

  // ==================== 印度 ====================
  {
    id: 'in-fieo',
    name: 'FIEO',
    type: 'association',
    url: 'https://www.fieo.com',
    country: 'IN',
    description: '印度出口组织联合会',
  },
  {
    id: 'in-mca',
    name: 'MCA India - Ministry of Corporate Affairs',
    type: 'government',
    url: 'https://www.mca.gov.in',
    country: 'IN',
    description: '印度公司事务部企业注册信息',
  },

  // ==================== 东南亚 ====================
  {
    id: 'sg-acra',
    name: 'Singapore ACRA BizFile+',
    type: 'government',
    url: 'https://www.acra.gov.sg',
    country: 'SG',
    description: '新加坡会计与企业管理局，免费企业数据查询',
  },
  {
    id: 'sg-data-gov',
    name: 'Singapore Government Data',
    type: 'government',
    url: 'https://data.gov.sg',
    country: 'SG',
    description: '新加坡政府开放数据门户',
  },
  {
    id: 'my-gov',
    name: 'Malaysia Government Open Data',
    type: 'government',
    url: 'https://data.gov.my',
    country: 'MY',
    description: '马来西亚政府开放数据门户',
  },
  {
    id: 'th-dbd',
    name: 'Thailand DBD - Department of Business Development',
    type: 'government',
    url: 'https://opencorporates.com/registers/258',
    country: 'TH',
    description: '泰国商业发展部企业注册处',
  },
  {
    id: 'vn-vcci',
    name: 'VCCI - Vietnam Chamber of Commerce',
    type: 'association',
    url: 'https://www.vcci.com.vn',
    country: 'VN',
    description: '越南工商会',
  },
  {
    id: 'ph-philbiz',
    name: 'Philippine Business Databank',
    type: 'government',
    url: 'https://databank.business.gov.ph',
    country: 'PH',
    description: '菲律宾商业数据库',
  },
  {
    id: 'id-djpk',
    name: 'Indonesia Data API',
    type: 'government',
    url: 'https://data.go.id',
    country: 'ID',
    description: '印度尼西亚政府开放数据门户',
  },

  // ==================== 中东 ====================
  {
    id: 'ae-bayanat',
    name: 'UAE Bayanat - Abu Dhabi Open Data',
    type: 'government',
    url: 'https://bayanat.ae',
    country: 'AE',
    description: '阿联酋阿布扎比开放数据平台',
  },
  {
    id: 'ae-dubaipulse',
    name: 'Dubai Pulse',
    type: 'government',
    url: 'https://www.dubaipulse.gov.ae',
    country: 'AE',
    description: '迪拜政府数据门户',
  },
  {
    id: 'sa-mc',
    name: 'Saudi Arabia Ministry of Commerce Open Data',
    type: 'government',
    url: 'https://mc.gov.sa/en/OpenData',
    country: 'SA',
    description: '沙特阿拉伯商业部开放数据',
  },
  {
    id: 'qa-beauh',
    name: 'Qatar Business Register',
    type: 'government',
    url: 'https://www.beauh.com',
    country: 'QA',
    description: '卡塔尔商业登记处',
  },
  {
    id: 'kw-ccpi',
    name: 'Kuwait Chamber of Commerce',
    type: 'association',
    url: 'https://www.kuwaitchamber.org.kw',
    country: 'KW',
    description: '科威特工商会',
  },
  {
    id: 'il-cci',
    name: 'Israel Chamber of Commerce',
    type: 'association',
    url: 'https://www.chamber.org.il',
    country: 'IL',
    description: '以色列商会',
  },

  // ==================== 非洲 ====================
  {
    id: 'za-cipc',
    name: 'South Africa CIPC',
    type: 'government',
    url: 'https://opencorporates.com/registers/244',
    country: 'ZA',
    description: '南非公司知识产权委员会',
  },
  {
    id: 'af-openafrica',
    name: 'openAFRICA',
    type: 'government',
    url: 'https://open.africa',
    country: 'AF',
    description: '非洲开放数据门户，经济数据集',
  },
  {
    id: 'ng-cac',
    name: 'Nigeria CAC',
    type: 'government',
    url: 'https://opencorporates.com/registers/230',
    country: 'NG',
    description: '尼日利亚企业事务委员会',
  },
  {
    id: 'eg-gic',
    name: 'Egypt GIC',
    type: 'government',
    url: 'https://www.gie.com.eg',
    country: 'EG',
    description: '埃及通用投资局',
  },
  {
    id: 'ke-rdl',
    name: 'Kenya Registry Data',
    type: 'government',
    url: 'https://opencorporates.com/registers/210',
    country: 'KE',
    description: '肯尼亚公司登记处',
  },

  // ==================== 拉丁美洲 ====================
  {
    id: 'mx-sat',
    name: 'Mexico SAT - RFC Registry',
    type: 'government',
    url: 'https://www.sat.gob.mx',
    country: 'MX',
    description: '墨西哥税务局RFC纳税人注册信息',
  },
  {
    id: 'mx-canacintra',
    name: 'CANACINTRA',
    type: 'association',
    url: 'https://www.canacintra.org.mx',
    country: 'MX',
    description: '墨西哥国家工业制造商协会',
  },
  {
    id: 'br-cnpj',
    name: 'Brazil CNPJ - Receita Federal',
    type: 'government',
    url: 'https://www.gov.br/receitafederal',
    country: 'BR',
    description: '巴西企业税务登记CNPJ数据库',
  },
  {
    id: 'ar-afip',
    name: 'Argentina AFIP',
    type: 'government',
    url: 'https://www.afip.gob.ar',
    country: 'AR',
    description: '阿根廷联邦公共收入管理局',
  },
  {
    id: 'co-rue',
    name: 'Colombia RUE',
    type: 'government',
    url: 'https://opencorporates.com/registers/149',
    country: 'CO',
    description: '哥伦比亚统一商业登记处',
  },
  {
    id: 'cl-cr',
    name: 'Chile Company Registry',
    type: 'government',
    url: 'https://opencorporates.com/registers/147',
    country: 'CL',
    description: '智利公司登记处',
  },
  {
    id: 'pe-rpc',
    name: 'Peru RPC',
    type: 'government',
    url: 'https://opencorporates.com/registers/234',
    country: 'PE',
    description: '秘鲁公共登记处',
  },

  // ==================== 东欧 ====================
  {
    id: 'pl-cr',
    name: 'Poland Central Register',
    type: 'government',
    url: 'https://opencorporates.com/registers/233',
    country: 'PL',
    description: '波兰企业中央登记处',
  },
  {
    id: 'cz-cr',
    name: 'Czech Republic Business Register',
    type: 'government',
    url: 'https://or.justice.cz/ias/ui/rejstciky',
    country: 'CZ',
    description: '捷克共和国商业登记处',
  },
  {
    id: 'ro-onrc',
    name: 'Romania ONRC',
    type: 'government',
    url: 'https://www.onrc.ro',
    country: 'RO',
    description: '罗马尼亚国家商业登记处',
  },

  // ==================== 中亚 ====================
  {
    id: 'kz-register',
    name: 'Kazakhstan State Register',
    type: 'government',
    url: 'https://www.opensanctions.org/datasets/ext_kz_companies',
    country: 'KZ',
    description: '哈萨克斯坦国家法律实体登记册',
  },
  {
    id: 'uz-register',
    name: 'Uzbekistan State Register',
    type: 'government',
    url: 'https://opencorporates.com/registers/273',
    country: 'UZ',
    description: '乌兹别克斯坦法律实体国家登记册',
  },

  // ==================== 大洋洲 ====================
  {
    id: 'au-abr',
    name: 'Australia ABR',
    type: 'government',
    url: 'https://abr.business.gov.au',
    country: 'AU',
    description: '澳大利亚商业登记处，免费企业查询',
  },
  {
    id: 'au-asic',
    name: 'Australia ASIC Registers',
    type: 'government',
    url: 'https://asic.gov.au/regulatory-tools/registers',
    country: 'AU',
    description: '澳大利亚证券投资委员会注册信息',
  },
  {
    id: 'nz-companies',
    name: 'New Zealand Companies Office',
    type: 'government',
    url: 'https://companies.nz',
    country: 'NZ',
    description: '新西兰公司办公室注册信息',
  },

  // ==================== 国际组织 ====================
  {
    id: 'un-ungm',
    name: 'UNGM - UN Global Marketplace',
    type: 'government',
    url: 'https://www.ungm.org',
    country: 'GLOBAL',
    description: '联合国全球采购平台，联合国系统官方采购门户',
  },
  {
    id: 'int-un-comtrade',
    name: 'UN Comtrade - United Nations Trade Data',
    type: 'government',
    url: 'https://comtrade.un.org',
    country: 'GLOBAL',
    description: '联合国商品贸易数据库，全球最全面的贸易数据，免费API',
  },
  {
    id: 'int-wits',
    name: 'WITS - World Bank Trade Solution',
    type: 'government',
    url: 'https://wits.worldbank.org',
    country: 'GLOBAL',
    description: '世界银行国际贸易解决方案，包含各国进出口统计数据',
  },
  {
    id: 'int-trade-map',
    name: 'ITC Trade Map',
    type: 'government',
    url: 'https://www.trademap.org',
    country: 'GLOBAL',
    description: '国际贸易中心贸易地图，免费访问世界贸易数据',
  },
  {
    id: 'int-imf',
    name: 'IMF International Trade Statistics',
    type: 'government',
    url: 'https://data.imf.org/en/datasets/IMF.STA:IMTS',
    country: 'GLOBAL',
    description: '国际货币基金组织国际贸易统计',
  },
  {
    id: 'int-oecd',
    name: 'OECD Data API',
    type: 'government',
    url: 'https://data.oecd.org',
    country: 'GLOBAL',
    description: '经合组织数据API，涵盖发达国家贸易和经济数据',
  },

  // ==================== 开发银行 ====================
  {
    id: 'devbank-wb',
    name: 'World Bank Projects',
    type: 'government',
    url: 'https://projects.worldbank.org',
    country: 'GLOBAL',
    description: '世界银行贷款项目',
  },
  {
    id: 'devbank-afdb',
    name: 'AfDB - African Development Bank',
    type: 'government',
    url: 'https://www.afdb.org/en/projects',
    country: 'AF',
    description: '非洲开发银行项目',
  },
  {
    id: 'devbank-iadb',
    name: 'IDB - Inter-American Development Bank',
    type: 'government',
    url: 'https://www.iadb.org',
    country: 'LATAM',
    description: '美洲开发银行项目',
  },
  {
    id: 'devbank-ebrd',
    name: 'EBRD - European Bank',
    type: 'government',
    url: 'https://www.ebrd.com',
    country: 'EU',
    description: '欧洲复兴开发银行项目',
  },
  {
    id: 'devbank-isdb',
    name: 'IsDB - Islamic Development Bank',
    type: 'government',
    url: 'https://www.isdb.org',
    country: 'GLOBAL',
    description: '伊斯兰开发银行项目',
  },

  // ==================== B2B平台 ====================
  {
    id: 'b2b-alibaba',
    name: 'Alibaba',
    type: 'b2b_platform',
    url: 'https://www.alibaba.com',
    country: 'GLOBAL',
    description: '全球B2B电商平台，制造商和供应商',
  },
  {
    id: 'b2b-madeinchina',
    name: 'Made-in-China',
    type: 'b2b_platform',
    url: 'https://www.made-in-china.com',
    country: 'CN',
    description: '中国制造商目录',
  },
  {
    id: 'b2b-globalsources',
    name: 'Global Sources',
    type: 'b2b_platform',
    url: 'https://www.globalsources.com',
    country: 'GLOBAL',
    description: '环球资源B2B平台',
  },
  {
    id: 'b2b-kompass',
    name: 'Kompass',
    type: 'b2b_platform',
    url: 'https://www.kompass.com',
    country: 'GLOBAL',
    description: '全球B2B企业目录，6000万+验证企业',
  },
  {
    id: 'b2b-infobel',
    name: 'Infobel Yellow Pages',
    type: 'b2b_platform',
    url: 'https://www.infobel.com',
    country: 'GLOBAL',
    description: '全球黄页数据库，覆盖50+国家',
  },

  // ==================== 贸易数据平台 ====================
  {
    id: 'trade-volza',
    name: 'Volza - Global Trade Data',
    type: 'trade_data',
    url: 'https://www.volza.com',
    country: 'GLOBAL',
    description: '全球进出口贸易数据，覆盖203国',
  },
  {
    id: 'trade-seair',
    name: 'SEAIR Exim Solutions',
    type: 'trade_data',
    url: 'https://www.seair.co.in',
    country: 'GLOBAL',
    description: '全球进出口数据平台',
  },
  {
    id: 'trade-datamyne',
    name: 'Descartes Datamyne',
    type: 'trade_data',
    url: 'https://www.datamyne.com',
    country: 'GLOBAL',
    description: '全球贸易数据，覆盖美洲和全球',
  },

  // ==================== 制裁和合规数据库 ====================
  {
    id: 'san-osc',
    name: 'OpenSanctions',
    type: 'government',
    url: 'https://www.opensanctions.org',
    country: 'GLOBAL',
    description: '开放制裁数据库，包含全球公司和个人制裁信息',
  },
  {
    id: 'san-eu-sanc',
    name: 'EU Sanctions Map',
    type: 'government',
    url: 'https://www.sanctionsmap.eu',
    country: 'EU',
    description: '欧盟制裁地图',
  },

  // ==================== 专利和商标 ====================
  {
    id: 'patent-patentsview',
    name: 'PatentsView',
    type: 'custom',
    url: 'https://patentsview.org',
    country: 'US',
    description: '美国专利商标局开放专利数据，免费查询',
  },
  {
    id: 'patent-lens',
    name: 'The Lens',
    type: 'custom',
    url: 'https://lens.org',
    country: 'GLOBAL',
    description: '免费开放专利和学术文献检索',
  },
  {
    id: 'patent-wipo',
    name: 'WIPO PCT Patents',
    type: 'government',
    url: 'https://www.wipo.int/patentscope/en',
    country: 'GLOBAL',
    description: '世界知识产权组织专利数据库',
  },
  {
    id: 'tm-wipo',
    name: 'WIPO Global Brand Database',
    type: 'government',
    url: 'https://www.wipo.int/en/web/global-brand-database',
    country: 'GLOBAL',
    description: '全球商标数据库，涵盖多国商标',
  },

  // ==================== 金融数据 ====================
  {
    id: 'fin-sec-edgar',
    name: 'SEC EDGAR',
    type: 'government',
    url: 'https://www.sec.gov/edgar',
    country: 'US',
    description: '美国证券交易委员会公司披露文件',
  },
  {
    id: 'fin-crunchbase',
    name: 'Crunchbase',
    type: 'custom',
    url: 'https://www.crunchbase.com',
    country: 'GLOBAL',
    description: '创业公司融资数据，有免费API层',
  },

  // ==================== 新闻和媒体监控 ====================
  {
    id: 'news-newsapi',
    name: 'NewsAPI',
    type: 'custom',
    url: 'https://newsapi.org',
    country: 'GLOBAL',
    description: '全球新闻文章API',
  },
  {
    id: 'news-gdelt',
    name: 'GDELT Project',
    type: 'custom',
    url: 'https://www.gdeltproject.org',
    country: 'GLOBAL',
    description: '全球事件、语言和情感数据集',
  },

  // ==================== 展会和博览会 ====================
  {
    id: 'expo-gitex',
    name: 'GITEX Exhibitors',
    type: 'trade_show',
    url: 'https://exhibitors.gitex.com',
    country: 'GLOBAL',
    description: 'GITEX科技博览会参展商',
  },
  {
    id: 'expo-adipec',
    name: 'ADIPEC Exhibitors',
    type: 'trade_show',
    url: 'https://www.adipec.com',
    country: 'GLOBAL',
    description: '阿布扎比石油博览会参展商',
  },
  {
    id: 'expo-ciie',
    name: 'CIIE Exhibitors',
    type: 'trade_show',
    url: 'https://www.ciie.org',
    country: 'CN',
    description: '中国国际进口博览会参展商',
  },

  // ==================== 行业协会 ====================
  {
    id: 'assoc-iso',
    name: 'ISO Members',
    type: 'association',
    url: 'https://www.iso.org/members.html',
    country: 'GLOBAL',
    description: '国际标准化组织成员目录',
  },
  {
    id: 'assoc-iec',
    name: 'IEC Members',
    type: 'association',
    url: 'https://www.iec.ch/members_experts',
    country: 'GLOBAL',
    description: '国际电工委员会成员',
  },
  {
    id: 'assoc-icc',
    name: 'ICC - International Chamber of Commerce',
    type: 'association',
    url: 'https://iccwbo.org',
    country: 'GLOBAL',
    description: '国际商会网络',
  },

  // ==================== 开放数据聚合 ====================
  {
    id: 'agg-odsoft',
    name: 'OpenDataSoft',
    type: 'government',
    url: 'https://public.opendatasoft.com/explore',
    country: 'GLOBAL',
    description: '开放数据聚合平台',
  },
  {
    id: 'agg-open-data',
    name: 'OpenData.org',
    type: 'government',
    url: 'https://opendata.org',
    country: 'GLOBAL',
    description: '全球实体开放数据图谱',
  },
  {
    id: 'gov-us-federal',
    name: 'US Data.gov',
    type: 'government',
    url: 'https://data.gov',
    country: 'US',
    description: '美国政府开放数据门户',
  },
  {
    id: 'gov-eu-open',
    name: 'EU Open Data Portal',
    type: 'government',
    url: 'https://data.europa.eu',
    country: 'EU',
    description: '欧盟开放数据门户',
  },
  {
    id: 'gov-uk-open',
    name: 'UK Data.gov.uk',
    type: 'government',
    url: 'https://data.gov.uk',
    country: 'UK',
    description: '英国政府开放数据门户',
  },

  // ==================== 能源数据 ====================
  {
    id: 'energy-eia',
    name: 'US EIA',
    type: 'government',
    url: 'https://www.eia.gov',
    country: 'GLOBAL',
    description: '美国能源信息管理局数据',
  },
  {
    id: 'energy-iea',
    name: 'IEA Data',
    type: 'government',
    url: 'https://www.iea.org',
    country: 'GLOBAL',
    description: '国际能源机构开放数据',
  },

  // ==================== 招聘数据 ====================
  {
    id: 'hire-jobdata',
    name: 'JobDataAPI',
    type: 'custom',
    url: 'https://jobdataapi.com',
    country: 'GLOBAL',
    description: '职位发布数据API',
  },

  // ==================== 医疗健康数据 ====================
  {
    id: 'health-nhs',
    name: 'NHS Directory API',
    type: 'government',
    url: 'https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services',
    country: 'UK',
    description: '英国国家医疗服务体系医疗目录API',
  },

  // ==================== 非营利组织 ====================
  {
    id: 'npo-every',
    name: 'Every.org Charity API',
    type: 'association',
    url: 'https://www.every.org/charity-api',
    country: 'US',
    description: '非营利组织搜索API，免费',
  },
  {
    id: 'npo-propublica',
    name: 'ProPublica Nonprofit Explorer',
    type: 'government',
    url: 'https://projects.propublica.org/nonprofits/api',
    country: 'US',
    description: '美国非营利组织公开数据API',
  },

  // ==================== 涂料行业特定 ====================
  {
    id: 'ind-coating',
    name: 'American Coatings Association',
    type: 'association',
    url: 'https://www.paint.org',
    country: 'US',
    description: '美国涂料协会',
  },
  {
    id: 'ind-european-coat',
    name: 'European Coatings Federation',
    type: 'association',
    url: 'https://www.european-coatings.com',
    country: 'EU',
    description: '欧洲涂料联合会',
  },
  {
    id: 'ind-jcia',
    name: 'Japan Coating Association',
    type: 'association',
    url: 'https://www.toryo.or.jp',
    country: 'JP',
    description: '日本涂料工业协会',
  },
  {
    id: 'ind-china-coat',
    name: 'China National Coatings Industry Association',
    type: 'association',
    url: 'https://www.ccia.org.cn',
    country: 'CN',
    description: '中国涂料工业协会',
  },

  // ==================== 招标聚合平台 ====================
  {
    id: 'tender-tendersinfo',
    name: 'TendersInfo',
    type: 'government',
    url: 'https://www.tendersinfo.com',
    country: 'GLOBAL',
    description: '全球招标信息聚合',
  },
  {
    id: 'tender-globaltenders',
    name: 'GlobalTenders',
    type: 'government',
    url: 'https://www.globaltenders.com',
    country: 'GLOBAL',
    description: '全球政府采购招标',
  },
];

/**
 * 按国家获取数据源
 */
export function getSourcesByCountry(country: string): DirectorySource[] {
  return DIRECTORY_SOURCES.filter(
    (s) => s.country.toLowerCase() === country.toLowerCase() || s.country === 'GLOBAL'
  );
}

/**
 * 按类型获取数据源
 */
export function getSourcesByType(type: DirectorySource['type']): DirectorySource[] {
  return DIRECTORY_SOURCES.filter((s) => s.type === type);
}

/**
 * 获取所有国家列表
 */
export function getAllCountries(): string[] {
  const countries = new Set(DIRECTORY_SOURCES.map((s) => s.country));
  return Array.from(countries).sort();
}

/**
 * 数据源统计
 */
export function getSourceStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const source of DIRECTORY_SOURCES) {
    stats[source.type] = (stats[source.type] || 0) + 1;
  }
  return stats;
}