const chatMessagesEl = document.getElementById('chatMessages');
const chatInputEl = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');

const SUPPORTS_FIELD_SIZING = CSS.supports('field-sizing', 'content');

if (!SUPPORTS_FIELD_SIZING) {
  var _chatMinH = 0;
  var _chatMaxH = 0;

  function initFallbackSizes() {
    var style = getComputedStyle(chatInputEl);
    var fontSize = parseFloat(style.getPropertyValue('--chat-font-size')) || 13;
    var lineHeight = parseFloat(style.getPropertyValue('--chat-line-height')) || 1.4;
    var maxRows = parseFloat(style.getPropertyValue('--chat-max-rows')) || 4;
    var paddingV = parseFloat(style.getPropertyValue('--chat-padding-v')) || 16;
    _chatMinH = fontSize * lineHeight + paddingV;
    _chatMaxH = fontSize * lineHeight * maxRows + paddingV;
  }

  function autoResizeChatInput() {
    chatInputEl.style.height = 'auto';
    var sh = chatInputEl.scrollHeight;
    if (sh >= _chatMaxH) {
      chatInputEl.style.height = _chatMaxH + 'px';
    } else {
      chatInputEl.style.height = Math.max(sh, _chatMinH) + 'px';
    }
  }

  initFallbackSizes();
  chatInputEl.addEventListener('input', autoResizeChatInput);
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_project_code',
      description: '在导入的知识文件缓存中搜索关键字，返回匹配的文件路径、行号和代码片段。用于查找API定义、函数实现、配置项等',
      parameters: {
        type: 'object',
        properties: {
          knowledgeId: { type: 'string', description: '知识条目ID' },
          keyword: { type: 'string', description: '搜索关键字，支持代码中的任意文本匹配' }
        },
        required: ['knowledgeId', 'keyword']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_file',
      description: '获取指定知识条目中某个文件的完整内容。用于阅读源码、理解实现细节',
      parameters: {
        type: 'object',
        properties: {
          knowledgeId: { type: 'string', description: '知识条目ID' },
          filePath: { type: 'string', description: '文件路径，如 src/main/java/com/example/Application.java' }
        },
        required: ['knowledgeId', 'filePath']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_project_files',
      description: '列出指定知识条目或目录的文件结构。用于了解项目组织、查找相关文件',
      parameters: {
        type: 'object',
        properties: {
          knowledgeId: { type: 'string', description: '知识条目ID' },
          directoryPath: { type: 'string', description: '目录路径，留空表示根目录' },
          depth: { type: 'number', description: '显示深度，默认2层，最大5层' }
        },
        required: ['knowledgeId']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_memories',
      description: '查询当前域名下的历史记忆文件列表。当用户问题与当前网站相关时，优先调用此工具获取历史经验。返回文件路径和内容预览',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: '域名，留空则使用当前标签页的 hostname' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_memory_file',
      description: '读取指定记忆文件的完整内容。通常在 search_memories 之后，根据文件名判断相关性后调用',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '记忆文件路径，如 makedaily.cn/造1条测试分类数据.md' }
        },
        required: ['filePath']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_memory_file',
      description: '将Markdown内容保存为记忆文件。用于存储生成的系统功能地图、编码经验总结等内容。文件按域名自动分类到记忆文件夹',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '记忆文件路径，如 makedaily.cn/功能地图.md。hostname部分自动取当前域名' },
          content: { type: 'string', description: '要保存的Markdown格式文件内容' }
        },
        required: ['content']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_output_file',
      description: '将文件保存到"工作产物"卡片中（独立于记忆系统）。用于存储 OpenSpec 变更产物（proposal/design/tasks/specs）、生成的代码文件、文档等。filePath 如 "openspec/changes/add-auth/proposal.md"，完整目录结构会被保留',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '文件路径，如 openspec/changes/add-auth/proposal.md 或 output/index.html' },
          content: { type: 'string', description: '文件内容（Markdown、HTML、代码等）' }
        },
        required: ['filePath', 'content']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_output_file',
      description: '从"工作产物"卡片中读取指定文件的完整内容。通常与 search_output_files 配合使用，先搜索找到文件路径再读取',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '文件路径，如 openspec/changes/add-auth/proposal.md' }
        },
        required: ['filePath']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_output_files',
      description: '查询"工作产物"卡片中的文件列表。支持按路径前缀过滤，返回文件路径、类型（file/directory）和内容预览。用于查找 OpenSpec 变更列表和产物文件',
      parameters: {
        type: 'object',
        properties: {
          pathPrefix: { type: 'string', description: '路径前缀过滤，如 "openspec/changes/" 查询所有变更，"openspec/changes/add-auth/" 查询指定变更' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ask_user',
      description: '向用户提问并获取结构化回答。用于需要用户决策的场景，如选择操作目标、确认参数、获取补充信息等。支持多种模式：仅预设选项（单/多选）、仅自由输入（开放问题）、选项+自由输入（混合模式）。用户回答后会返回结构化结果供后续处理',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '向用户提出的问题，清晰描述需要用户做什么选择或提供什么信息' },
          options: { type: 'array', items: { type: 'string' }, description: '预设的回答选项列表。如果不提供则仅展示自由输入框' },
          multiSelect: { type: 'boolean', description: '是否允许多选。为true时选项以多选框形式展示，用户需点击确认按钮提交。仅在提供了options时有效' },
          allowFreeInput: { type: 'boolean', description: '是否允许用户在选项之外自由输入自定义回答。为true时显示文本输入框。当没有预设选项时应设为true' },
          placeholder: { type: 'string', description: '自由输入框的占位提示文字，如"请输入..."。仅在allowFreeInput为true时生效' }
        },
        required: ['question']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_auth',
      description: '在执行敏感操作（如删除数据、修改配置、发送请求等）前请求用户授权确认。必须等待用户明确同意后才可继续执行。如果用户拒绝，会话将被终止',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: '需要授权的操作名称，如"删除用户数据"、"修改服务器配置"、"发送HTTP请求"等' },
          detail: { type: 'string', description: '操作的详细说明，描述具体将执行什么、可能的影响或风险' },
          riskLevel: { type: 'string', enum: ['low', 'medium', 'high'], description: '风险等级：low=低风险操作，medium=中等风险，high=高风险不可逆操作' }
        },
        required: ['action', 'detail']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'display_table',
      description: '以表格形式展示结构化数据给用户。用于展示查询结果、数据列表、对比信息等。可选开启行点击模式让用户选择某一行数据。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '表格标题，显示在卡片头部' },
          columns: { type: 'array', items: { type: 'string' }, description: '列名数组，定义表格的列头' },
          rows: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: '行数据二维数组，每行是一个字符串数组，与columns一一对应' },
          clickable: { type: 'boolean', description: '行是否可点击。为true时用户点击某行后返回该行数据供后续处理。默认false仅展示' }
        },
        required: ['title', 'columns', 'rows']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'provide_file',
      description: '提供文件供用户下载到本地。用于生成代码文件、配置文件、报告、数据导出等场景。',
      parameters: {
        type: 'object',
        properties: {
          fileName: { type: 'string', description: '下载文件名，如 config.json、report.html、data.csv' },
          content: { type: 'string', description: '文件完整内容（文本）' },
          mimeType: { type: 'string', description: 'MIME类型，如 application/json、text/html、text/csv。默认text/plain' }
        },
        required: ['fileName', 'content']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'present_output_files',
      description: '在聊天面板中展示工作产物文件集合卡片。用于在工作完成后汇总展示本次产出的文件，让用户可以预览和批量下载。通常在调用 save_output_file 保存完一批文件后使用，pathPrefix 可指定展示特定路径下的文件',
      parameters: {
        type: 'object',
        properties: {
          pathPrefix: { type: 'string', description: '按路径前缀过滤文件，如 "openspec/changes/add-auth/"。不传则展示全部文件' },
          showTree: { type: 'boolean', description: '是否按目录树结构展示。默认 true' },
          emptyMessage: { type: 'string', description: '无文件时的提示语，默认使用系统内置提示' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'activate_skill',
      description: '激活指定技能并获取其完整规则正文。当判断用户请求匹配某个已注册技能的意图时，必须首先调用此工具获取该技能的完整规则，然后严格遵循规则执行。即使任务简单也不可跳过此步骤。激活后状态栏会自动显示技能标签',
      parameters: {
        type: 'object',
        properties: {
          skillId: { type: 'string', description: '要激活的技能ID，从已注册技能目录中的 id 获取' }
        },
        required: ['skillId']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_context',
      description: '获取当前浏览器页面的上下文信息，包括 URL、标题和可见的表单字段列表（input、select、textarea 等）',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_interactive_elements',
      description: '获取当前页面所有可见可交互元素（链接、按钮、菜单项等），返回元素列表，每项包含 tagName、文本、CSS选择器、坐标、角色、链接等信息，最多返回 100 个元素',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'click_element',
      description: '通过 CSS 选择器点击当前页面上的指定元素。系统会自动检测页面是否发生跳转或变化。注意：包含删除、注销、清空等危险关键词的元素将被拒绝点击',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: '目标元素的 CSS 选择器，如 .nav-item、#submit-btn、button.primary' },
          timeout: { type: 'number', description: '等待页面变化的超时毫秒数，默认 3000ms' }
        },
        required: ['selector']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'input_text',
      description: '通过 CSS 选择器向页面上的输入框（input、textarea）或可编辑区域（contenteditable）写入文本内容。自动触发 input 和 change 事件以兼容 React/Vue 等前端框架',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: '目标输入元素的 CSS 选择器，如 #username、input.email、textarea.comment' },
          text: { type: 'string', description: '要写入的文本内容' }
        },
        required: ['selector', 'text']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'refresh_page',
      description: '刷新当前浏览器标签页。用于重新加载页面以捕获 HTTP 请求或获取最新的页面状态',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_request',
      description: '在当前页面上下文中执行 HTTP 请求（通过 fetch API）。用于调用后端接口、提交数据、查询资源等。返回响应的状态码、响应头和响应体（最大50000字符）',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '请求的完整 URL' },
          method: { type: 'string', description: 'HTTP 方法，如 GET、POST、PUT、DELETE 等' },
          headers: { type: 'object', description: '请求头键值对，如 {"Content-Type": "application/json", "Authorization": "Bearer xxx"}' },
          body: { type: 'string', description: '请求体内容（GET/HEAD 请求时忽略）' }
        },
        required: ['url', 'method']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_css',
      description: '获取当前浏览器页面的 CSS 样式信息。支持两种模式：\n'
        + '- computed: 获取指定 CSS 选择器对应元素的计算样式（仅返回与浏览器默认值不同的属性），用于分析按钮颜色、字体、边距等 UI 属性\n'
        + '- stylesheet: 获取页面所有 <style> 和 <link rel="stylesheet"> 的 CSS 规则原文，用于分析样式组织、CSS 变量、响应式断点等',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: '目标元素的 CSS 选择器，如 .btn-primary、#header、h1。computed 模式必填，stylesheet 模式可选' },
          mode: { type: 'string', enum: ['computed', 'stylesheet'], description: '提取模式：computed=计算样式, stylesheet=样式表原文。默认 computed' },
          maxLength: { type: 'number', description: '最大返回字符数，超出将被截断。默认 50000' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_source',
      description: '获取当前浏览器页面的 HTML 源码。支持获取完整页面或指定 CSS 选择器元素的 outerHTML，超出最大长度时自动截断',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: '目标元素的 CSS 选择器，如 #main-content、div.container。默认 body（获取整个页面）' },
          maxLength: { type: 'number', description: '最大返回字符数，超出将被截断。默认 50000' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_js',
      description: '获取当前浏览器页面的 JavaScript 代码。支持三种模式：\n'
        + '- inline: 提取所有内联 <script> 标签的 JS 代码\n'
        + '- external: 列出所有外部引用的 <script src="..."> URL\n'
        + '- all: 同时返回内联脚本和外部引用',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['inline', 'external', 'all'], description: '提取模式：inline=内联脚本代码, external=外部脚本URL列表, all=全部。默认 inline' },
          maxLength: { type: 'number', description: '最大返回字符数，超出将被截断。默认 50000' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_skill_collection',
      description: '创建技能收藏夹。将多个已注册技能打包成一个收藏夹，方便用户快速访问。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '收藏夹名称，如"UI测试工具集"' },
          description: { type: 'string', description: '收藏夹描述，一句话概括收藏夹的用途' },
          skillIds: { type: 'array', items: { type: 'string' }, description: '要收藏的技能ID数组，如 ["test-data-generation", "code-master"]' }
        },
        required: ['name', 'description', 'skillIds']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_skill_collection',
      description: '删除指定的技能收藏夹。',
      parameters: {
        type: 'object',
        properties: {
          collectionId: { type: 'string', description: '要删除的收藏夹ID' }
        },
        required: ['collectionId']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_skills_to_collection',
      description: '向已有收藏夹中添加技能。已存在的技能会自动跳过（去重）。',
      parameters: {
        type: 'object',
        properties: {
          collectionId: { type: 'string', description: '目标收藏夹ID' },
          skillIds: { type: 'array', items: { type: 'string' }, description: '要添加的技能ID数组' }
        },
        required: ['collectionId', 'skillIds']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_skills_from_collection',
      description: '从收藏夹中移除指定技能。',
      parameters: {
        type: 'object',
        properties: {
          collectionId: { type: 'string', description: '目标收藏夹ID' },
          skillIds: { type: 'array', items: { type: 'string' }, description: '要移除的技能ID数组' }
        },
        required: ['collectionId', 'skillIds']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_captured_requests',
      description: '获取当前标签页捕获到的所有网络请求摘要列表。每个请求包含 requestId、method、url、path、status。用于浏览页面发起了哪些 API 调用，找到目标接口的 requestId',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_captured_request_detail',
      description: '获取指定请求的完整详情，包括请求头、请求体和响应体。先用 get_captured_requests 获取请求列表和目标接口的 requestId，再用此工具获取 Schema 定义',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string', description: '请求 ID，来自 get_captured_requests 返回的 requestId 字段' }
        },
        required: ['requestId']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_url',
      description: '将当前活跃浏览器标签页导航到指定 URL。用于让用户浏览器跳转到目标网站或页面。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '目标 URL，必须以 http:// 或 https:// 开头' },
          waitForLoad: { type: 'boolean', description: '是否等待页面加载完成后再返回。默认 true' }
        },
        required: ['url']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_new_tab',
      description: '在当前浏览器窗口中打开新标签页并导航到指定 URL。新标签页将成为活跃标签页。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '新标签页的目标 URL，必须以 http:// 或 https:// 开头，或为空字符串打开空白页' }
        },
        required: ['url']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'switch_to_tab',
      description: '切换浏览器到指定的标签页。可以通过 tabId 精确切换，或通过 urlPattern 匹配第一个 URL 包含该模式的标签页。需要至少提供一个参数。',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: '目标标签页的 tabId，来自 list_tabs 返回的精确 ID' },
          urlPattern: { type: 'string', description: 'URL 包含匹配模式，如 "github.com"，将切换到第一个匹配的标签页' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_tab',
      description: '关闭指定的浏览器标签页。不会关闭窗口中的最后一个标签页以防止浏览器窗口关闭。',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: '要关闭的标签页 tabId，来自 list_tabs 返回的 ID' }
        },
        required: ['tabId']
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tabs',
      description: '列出当前浏览器窗口中所有打开的标签页信息，包括各自的 tabId、URL、标题和是否活跃。用于了解用户的浏览状态，为后续 tab 操作提供参考。',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_user_files',
      description: '查询「用户聊天提交文件」卡片中的文件列表。支持按路径前缀过滤，返回文件路径、类型（file/directory）和内容预览。用于了解用户通过聊天附件提交了哪些文件',
      parameters: {
        type: 'object',
        properties: {
          pathPrefix: { type: 'string', description: '路径前缀过滤，如会话ID。用于查询某次提交的所有文件' }
        },
        required: []
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_file',
      description: '读取「用户聊天提交文件」卡片中指定文件的完整内容。通常与 search_user_files 配合使用，先搜索找到文件路径再读取',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '文件路径，如 abc123/error.log' }
        },
        required: ['filePath']
      },
    },
  },
];
const MAX_TOOL_ROUNDS_DEFAULT = 5000;
const REQUEST_TIMEOUT_MS = 120000;
const TOOL_TIMEOUT_MS = 10000;
const CONTEXT_MAX_CHARS = 1000;

const MAX_FILE_COUNT = 5;

const ALLOWED_EXTENSIONS = [
  '.txt', '.log', '.json', '.xml', '.csv', '.md', '.yml', '.yaml',
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.html', '.css',
  '.sql', '.sh', '.bash', '.env', '.cfg', '.ini', '.conf', '.toml',
  '.properties', '.gradle', '.kt', '.swift', '.rs', '.go', '.c', '.h', '.cpp', '.hpp'
];

const ALLOWED_MIME_TYPES = [
  'text/', 'application/json', 'application/javascript', 'application/xml'
];

async function getMaxToolRounds() {
  try {
    const result = await chrome.storage.local.get('ai_helper_settings');
    if (result.ai_helper_settings && typeof result.ai_helper_settings.maxToolRounds === 'number' && result.ai_helper_settings.maxToolRounds > 0) {
      return result.ai_helper_settings.maxToolRounds;
    }
  } catch {
    // ignore
  }
  return MAX_TOOL_ROUNDS_DEFAULT;
}

let currentAbortController = null;

function getCurrentSessionMessages() {
  return window.chatMessages || [];
}

async function setCurrentSessionMessages(messages) {
  window.chatMessages = messages;
  var sid = window.currentSessionId;
  if (sid && typeof SessionManager !== 'undefined') {
    await SessionManager.updateSessionMessages(sid, messages);
  }
}

async function saveCurrentMessages() {
  await setCurrentSessionMessages(getCurrentSessionMessages());
}

var skillStatusBarEl = document.getElementById('skillStatusBar');

function renderSkillStatusBar() {
  if (!skillStatusBarEl) {
    skillStatusBarEl = document.getElementById('skillStatusBar');
  }
  if (!skillStatusBarEl) return;

  var registry = window.__getSkillRegistry();
  var active = registry.getActive();

  if (active.length === 0) {
    skillStatusBarEl.style.display = 'none';
    skillStatusBarEl.innerHTML = '';
    return;
  }

  skillStatusBarEl.style.display = 'flex';
  var html = '';
  active.forEach(function (s) {
    html += '<span class="skill-status-tag">' + s.name + '<span class="skill-status-tag-close" data-skill-id="' + s.id + '">&times;</span></span>';
  });
  skillStatusBarEl.innerHTML = html;

  skillStatusBarEl.querySelectorAll('.skill-status-tag-close').forEach(function (el) {
    el.addEventListener('click', function () {
      var skillId = el.getAttribute('data-skill-id');
      var r = window.__getSkillRegistry();
      r.deactivate(skillId);
      renderSkillStatusBar();
      if (chatInputEl) {
        var prefix = '/' + skillId;
        if (chatInputEl.value.startsWith(prefix)) {
          var trimmed = chatInputEl.value.slice(prefix.length).replace(/^\s+/, '');
          chatInputEl.value = trimmed;
        }
      }
    });
  });
}

window.__getSkillRegistry().onSkillEvent(function () {
  renderSkillStatusBar();
});

renderSkillStatusBar();

function renderChatMessages(messages) {
  chatMessagesEl.innerHTML = '';
  if (!messages || messages.length === 0) {
    chatMessagesEl.innerHTML = '<div class="empty-hint">' + t('chat.emptyHint') + '</div>';
    return;
  }
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];


    if (msg.role === 'tool') {
      continue;
    }
    if (msg.role === 'skill_activation') {
      createSkillActivationCard({ name: msg.skillName, description: msg.skillDescription });
      continue;
    }

    if (msg.reasoning_content) {
      let tw = document.createElement('div');
      tw.className = 'chat-message chat-message-thinking thinking-collapsed';
      let tb = document.createElement('div');
      tb.className = 'chat-bubble chat-bubble-thinking';

      let rheader = document.createElement('div');
      rheader.className = 'thinking-header';
      let rlabel = document.createElement('span');
      rlabel.className = 'thinking-label';
      rlabel.textContent = t('chat.thinkingLabel');
      let rarrow = document.createElement('span');
      rarrow.className = 'thinking-arrow';
      rarrow.textContent = '▶';
      let rcontent = document.createElement('div');
      rcontent.className = 'thinking-content';
      rcontent.textContent = msg.reasoning_content;

      rheader.addEventListener('click', function () {
        tw.classList.toggle('thinking-collapsed');
        rarrow.textContent = tw.classList.contains('thinking-collapsed') ? '▶' : '▼';
      });

      rheader.appendChild(rlabel);
      rheader.appendChild(rarrow);
      tb.appendChild(rheader);
      tb.appendChild(rcontent);
      tw.appendChild(tb);
      chatMessagesEl.appendChild(tw);
    }

    if (msg.tool_calls) {
      var allToolCalls = [];
      var allResults = [];
      var scanIdx = i;

      while (scanIdx < messages.length) {
        var scanMsg = messages[scanIdx];
        if (scanMsg.role === 'assistant' && scanMsg.tool_calls) {
          for (var j = 0; j < scanMsg.tool_calls.length; j++) {
            var toolId = scanMsg.tool_calls[j].id;
            allToolCalls.push(scanMsg.tool_calls[j]);
            for (var k = scanIdx + 1; k < messages.length; k++) {
              if (messages[k].role === 'tool' && messages[k].tool_call_id === toolId) {
                allResults.push(messages[k].content);
                break;
              }
            }
            if (allResults.length < allToolCalls.length) {
              allResults.push('');
            }
          }
          scanIdx++;
        } else if (scanMsg.role === 'tool') {
          scanIdx++;
        } else {
          break;
        }
      }

      if (allToolCalls.length > 1) {
        var groupedCard = createGroupedToolCard(allToolCalls);
        for (var ti = 0; ti < allToolCalls.length; ti++) {
          var tArgsObj = safeParseArgs(allToolCalls[ti].function.arguments);
          updateGroupedSubItem(groupedCard, ti, 'executing', { args: tArgsObj });
          if (ti < allResults.length) {
            updateGroupedSubItem(groupedCard, ti, 'completed', { result: allResults[ti] });
          }
        }
        autoCollapseGroupCard(groupedCard);
        i = scanIdx - 1;
        continue;
      }

      var tc = allToolCalls[0];
      var argsObj = safeParseArgs(tc.function.arguments);
      var cardData = createCollapsibleToolCard(tc.function.name);
      setCardState(cardData, 'executing', { args: argsObj });
      if (allResults.length > 0) {
        setCardState(cardData, 'completed', { result: allResults[0] });
      }
      setCardState(cardData, 'collapsed');
    }

    if (msg.content) {
      if (msg.role === 'assistant') {
        var markdownHtml = typeof renderMarkdown === 'function' ? renderMarkdown(msg.content) : msg.content;
        appendMessageBubble(msg.role, markdownHtml, false, true);
      } else {
        appendMessageBubble(msg.role, msg.content, false, false);
      }
    }
  }
  scrollToBottom(true);
}

function createMessageBubble(role, content, isHtml) {
  const wrapper = document.createElement('div');
  wrapper.className = `chat-message chat-message-${role}`;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble-${role}`;
  if (isHtml) {
    bubble.innerHTML = content;
  } else {
    bubble.textContent = content;
  }

  wrapper.appendChild(bubble);
  return { wrapper, bubble };
}

function appendMessageBubble(role, content, shouldScroll, isHtml) {
  console.log('[appendMessageBubble] role:', role, 'el:', !!chatMessagesEl);
  if (chatMessagesEl.querySelector('.empty-hint')) {
    chatMessagesEl.innerHTML = '';
  }

  const { wrapper } = createMessageBubble(role, content, isHtml);
  chatMessagesEl.appendChild(wrapper);

  if (shouldScroll) {
    scrollToBottom(true);
  }

  return wrapper;
}

function updateAIBubble(bubbleEl, newText, isHtml) {
  if (isHtml) {
    bubbleEl.innerHTML = newText;
  } else {
    bubbleEl.textContent = newText;
  }
}

function renderMarkdown(text) {
  if (typeof marked === 'undefined') return text;
  try {
    return marked.parse(text, { breaks: true, gfm: true });
  } catch {
    return text;
  }
}

function scrollToBottom(force) {
  if (!force) {
    const threshold = 60;
    const distanceToBottom = chatMessagesEl.scrollHeight - chatMessagesEl.scrollTop - chatMessagesEl.clientHeight;
    if (distanceToBottom > threshold) return;
  }
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function showErrorBubble(errorText) {
  if (chatMessagesEl.querySelector('.empty-hint')) {
    chatMessagesEl.innerHTML = '';
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-assistant';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-error';
  bubble.textContent = '❌ ' + errorText;

  wrapper.appendChild(bubble);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  var msgs = getCurrentSessionMessages();
  msgs.push({ role: 'assistant', content: errorText });
  saveCurrentMessages();

  return wrapper;
}

function createInfoBubble(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-info';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-info';
  bubble.innerHTML = '<span class="info-text">' + text + '</span>';

  wrapper.appendChild(bubble);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);
  return bubble;
}

function createThinkingBubble() {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-thinking';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-thinking';

  const header = document.createElement('div');
  header.className = 'thinking-header';

  const label = document.createElement('span');
  label.className = 'thinking-label';
  label.textContent = t('chat.thinkingLabel');

  const arrow = document.createElement('span');
  arrow.className = 'thinking-arrow';
  arrow.textContent = '▼';

  const content = document.createElement('div');
  content.className = 'thinking-content';

  header.addEventListener('click', function () {
    wrapper.classList.toggle('thinking-collapsed');
    arrow.textContent = wrapper.classList.contains('thinking-collapsed') ? '▶' : '▼';
  });

  header.appendChild(label);
  header.appendChild(arrow);
  bubble.appendChild(header);
  bubble.appendChild(content);
  wrapper.appendChild(bubble);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);
  return wrapper;
}

let activeToolCards = [];

function createSkillActivationCard(skill) {
  var wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-skill-card';

  var card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-skill-card';

  var icon = document.createElement('span');
  icon.className = 'skill-card-icon';
  icon.textContent = '⚡';

  var info = document.createElement('div');
  info.className = 'skill-card-info';

  var nameEl = document.createElement('span');
  nameEl.className = 'skill-card-name';
  nameEl.textContent = skill.name;

  var descEl = document.createElement('span');
  descEl.className = 'skill-card-desc';
  descEl.textContent = skill.description || '';

  info.appendChild(nameEl);
  info.appendChild(descEl);
  card.appendChild(icon);
  card.appendChild(info);
  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);
}

function getToolDisplayName(toolName) {
  var key = 'chat.tool_' + toolName;
  var translated = t(key);
  if (translated === key) return toolName;
  return translated;
}

function createCollapsibleToolCard(toolName) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-tool-card';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-tool-card tool-card-collapsed';

  card.innerHTML = '<div class="tool-card-header">'
    + '<span class="tool-card-icon">' + '⚡' + '</span>'
    + '<span class="tool-card-name">' + getToolDisplayName(toolName) + '</span>'
    + '<span class="tool-card-status">' + t('chat.processing') + '</span>'
    + '<span class="tool-card-toggle">▶</span>'
    + '</div>'
    + '<div class="tool-card-body">'
    + '<div class="tool-card-section">'
    + '<div class="tool-card-section-title">' + t('chat.arguments') + '</div>'
    + '<pre class="tool-card-args"></pre>'
    + '</div>'
    + '<div class="tool-card-section">'
    + '<div class="tool-card-section-title">' + t('chat.result') + '</div>'
    + '<pre class="tool-card-result"></pre>'
    + '</div>'
    + '</div>';

  card.querySelector('.tool-card-header').addEventListener('click', function () {
    const isCollapsed = card.classList.contains('tool-card-collapsed');
    const toggleEl = card.querySelector('.tool-card-toggle');
    if (isCollapsed) {
      card.classList.remove('tool-card-collapsed');
      card.classList.add('tool-card-expanded');
      if (toggleEl) toggleEl.textContent = '▼';
    } else {
      card.classList.add('tool-card-collapsed');
      card.classList.remove('tool-card-expanded');
      if (toggleEl) toggleEl.textContent = '▶';
    }
  });

  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return { wrapper, card };
}

function setCardState(cardData, state, info) {
  const { card } = cardData;
  const iconEl = card.querySelector('.tool-card-icon');
  const statusEl = card.querySelector('.tool-card-status');
  const argsEl = card.querySelector('.tool-card-args');
  const resultEl = card.querySelector('.tool-card-result');
  const toggleEl = card.querySelector('.tool-card-toggle');

  if (state === 'executing') {
    card.classList.remove('tool-card-collapsed');
    card.classList.add('tool-card-expanded');
    if (iconEl) iconEl.textContent = '⚡';
    if (statusEl) statusEl.textContent = t('chat.processing');
    if (argsEl && info.args) {
      argsEl.textContent = JSON.stringify(info.args, null, 2);
    }
    if (toggleEl) toggleEl.textContent = '▼';
  } else if (state === 'completed') {
    if (iconEl) iconEl.textContent = '🔧';
    if (statusEl) statusEl.textContent = '';
    if (resultEl && info.result) {
      var preview = '';
      try {
        var parsed = JSON.parse(info.result);
        if (parsed.error) {
          preview = '❌ ' + parsed.error;
        } else if (parsed.message) {
          preview = parsed.message;
        } else {
          preview = JSON.stringify(parsed, null, 2);
        }
      } catch (e) {
        preview = info.result;
      }
      resultEl.textContent = preview.substring(0, 2000);
    }
    card.classList.add('tool-card-collapsed');
    card.classList.remove('tool-card-expanded');
    if (toggleEl) toggleEl.textContent = '▶';
  } else if (state === 'collapsed') {
    card.classList.add('tool-card-collapsed');
    card.classList.remove('tool-card-expanded');
    if (toggleEl) toggleEl.textContent = '▶';
  }
}

function autoCollapseToolCards() {
  activeToolCards.forEach(function (cardData) {
    setCardState(cardData, 'collapsed');
  });
}

function createGroupedToolCard(toolCalls) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-tool-card-group';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-tool-card-group tool-card-group-collapsed';

  const count = toolCalls.length;
  const headerText = t('chat.toolGroupCall', { count: count });

  var subItemsHtml = '';
  for (var i = 0; i < toolCalls.length; i++) {
    var name = getToolDisplayName(toolCalls[i].function.name);
    subItemsHtml +=
      '<div class="tool-card-sub-item tool-card-sub-collapsed" data-sub-index="' + i + '">'
      + '<div class="tool-card-sub-header">'
      + '<span class="tool-card-sub-icon">⚡</span>'
      + '<span class="tool-card-sub-name">' + name + '</span>'
      + '<span class="tool-card-sub-status">' + t('chat.processing') + '</span>'
      + '<span class="tool-card-sub-toggle">▶</span>'
      + '</div>'
      + '<div class="tool-card-sub-body">'
      + '<div class="tool-card-section">'
      + '<div class="tool-card-section-title">' + t('chat.arguments') + '</div>'
      + '<pre class="tool-card-args"></pre>'
      + '</div>'
      + '<div class="tool-card-section">'
      + '<div class="tool-card-section-title">' + t('chat.result') + '</div>'
      + '<pre class="tool-card-result"></pre>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  card.innerHTML =
    '<div class="tool-card-group-header">'
    + '<span class="tool-card-group-icon">🔧</span>'
    + '<span class="tool-card-group-label">' + headerText + '</span>'
    + '<span class="tool-card-group-count">(0/' + count + ')</span>'
    + '<span class="tool-card-group-toggle">▶</span>'
    + '</div>'
    + '<div class="tool-card-group-body">'
    + subItemsHtml
    + '</div>';

  card.querySelector('.tool-card-group-header').addEventListener('click', function () {
    var isCollapsed = card.classList.contains('tool-card-group-collapsed');
    var toggleEl = card.querySelector('.tool-card-group-toggle');
    if (isCollapsed) {
      card.classList.remove('tool-card-group-collapsed');
      if (toggleEl) toggleEl.textContent = '▼';
    } else {
      card.classList.add('tool-card-group-collapsed');
      if (toggleEl) toggleEl.textContent = '▶';
    }
  });

  var subItems = card.querySelectorAll('.tool-card-sub-item');
  subItems.forEach(function (subItem) {
    var subHeader = subItem.querySelector('.tool-card-sub-header');
    subHeader.addEventListener('click', function (e) {
      e.stopPropagation();
      var isSubCollapsed = subItem.classList.contains('tool-card-sub-collapsed');
      var subToggle = subItem.querySelector('.tool-card-sub-toggle');
      if (isSubCollapsed) {
        subItem.classList.remove('tool-card-sub-collapsed');
        if (subToggle) subToggle.textContent = '▼';
      } else {
        subItem.classList.add('tool-card-sub-collapsed');
        if (subToggle) subToggle.textContent = '▶';
      }
    });
  });

  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return { wrapper: wrapper, card: card, subItems: subItems };
}

function updateGroupedSubItem(groupCard, index, state, info) {
  var subItems = groupCard.card.querySelectorAll('.tool-card-sub-item');
  var subItem = subItems[index];
  if (!subItem) return;

  var iconEl = subItem.querySelector('.tool-card-sub-icon');
  var statusEl = subItem.querySelector('.tool-card-sub-status');
  var argsEl = subItem.querySelector('.tool-card-args');
  var resultEl = subItem.querySelector('.tool-card-result');

  if (state === 'executing') {
    subItem.classList.remove('tool-card-sub-collapsed');
    if (iconEl) iconEl.textContent = '⚡';
    if (statusEl) statusEl.textContent = t('chat.processing');
    if (argsEl && info.args) {
      argsEl.textContent = JSON.stringify(info.args, null, 2);
    }
    var subToggle = subItem.querySelector('.tool-card-sub-toggle');
    if (subToggle) subToggle.textContent = '▼';
  } else if (state === 'completed') {
    if (iconEl) iconEl.textContent = '🔧';
    if (statusEl) statusEl.textContent = '';
    if (resultEl && info.result) {
      var preview = '';
      try {
        var parsed = JSON.parse(info.result);
        if (parsed.error) {
          preview = '❌ ' + parsed.error;
        } else if (parsed.message) {
          preview = parsed.message;
        } else {
          preview = JSON.stringify(parsed, null, 2);
        }
      } catch (e) {
        preview = info.result;
      }
      resultEl.textContent = preview.substring(0, 2000);
    }
    subItem.classList.add('tool-card-sub-collapsed');
    var subToggle2 = subItem.querySelector('.tool-card-sub-toggle');
    if (subToggle2) subToggle2.textContent = '▶';
  }

  var total = subItems.length;
  var completed = 0;
  subItems.forEach(function (si) {
    var sIcon = si.querySelector('.tool-card-sub-icon');
    if (sIcon && sIcon.textContent === '🔧') completed++;
  });
  var countEl = groupCard.card.querySelector('.tool-card-group-count');
  if (countEl) {
    countEl.textContent = '(' + completed + '/' + total + ')';
  }
}

function autoCollapseGroupCard(groupCard) {
  groupCard.card.classList.add('tool-card-group-collapsed');
  var toggleEl = groupCard.card.querySelector('.tool-card-group-toggle');
  if (toggleEl) toggleEl.textContent = '▶';
}

function safeParseArgs(argsStr) {
  try {
    return JSON.parse(argsStr);
  } catch {
    return { raw: argsStr };
  }
}

function htmlEscape(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getRiskLevelText(riskLevel) {
  if (riskLevel === 'high') return '🔴 ' + (t ? t('chat.authRiskHigh') : '高风险');
  if (riskLevel === 'medium') return '🟡 ' + (t ? t('chat.authRiskMedium') : '中风险');
  if (riskLevel === 'low') return '🟢 ' + (t ? t('chat.authRiskLow') : '低风险');
  return '';
}

function createQuestionCard(question, options, allowFreeInput, placeholder, multiSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-question-card';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-question-card';

  const header = document.createElement('div');
  header.className = 'question-card-header';
  header.textContent = '🤔 ' + question;

  card.appendChild(header);

  if (options && options.length > 0) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'question-card-options';
    for (var i = 0; i < options.length; i++) {
      if (multiSelect) {
        const label = document.createElement('label');
        label.className = 'question-card-checkbox-label';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'question-card-checkbox';
        checkbox.value = options[i];
        checkbox.setAttribute('data-option-value', options[i]);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + options[i]));
        optionsDiv.appendChild(label);
      } else {
        const btn = document.createElement('button');
        btn.className = 'question-card-option-btn';
        btn.textContent = options[i];
        btn.setAttribute('data-option-value', options[i]);
        btn.setAttribute('data-choice-type', 'option');
        optionsDiv.appendChild(btn);
      }
    }
    if (multiSelect) {
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'question-card-confirm-btn';
      confirmBtn.textContent = '✓ ' + (t ? t('chat.questionCardConfirm') : '确认选择');
      confirmBtn.setAttribute('data-choice-type', 'multi-confirm');
      optionsDiv.appendChild(confirmBtn);
    }
    card.appendChild(optionsDiv);
  }

  if (allowFreeInput) {
    const freeInputDiv = document.createElement('div');
    freeInputDiv.className = 'question-card-free-input';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'question-card-input';
    input.placeholder = placeholder || (t ? t('chat.questionCardInputPlaceholder') : '输入你的回答...');

    const submitBtn = document.createElement('button');
    submitBtn.className = 'question-card-submit-btn';
    submitBtn.textContent = t ? t('chat.questionCardSubmit') : '提交';
    submitBtn.setAttribute('data-choice-type', 'free-input');

    freeInputDiv.appendChild(input);
    freeInputDiv.appendChild(submitBtn);
    card.appendChild(freeInputDiv);
  }

  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return wrapper;
}

function handleQuestionCard(cardWrapper, options, allowFreeInput, multiSelect) {
  return new Promise(function (resolve, reject) {
    var resolved = false;

    function resolveWith(value) {
      if (resolved) return;
      resolved = true;
      var allBtns = cardWrapper.querySelectorAll('.question-card-option-btn, .question-card-submit-btn, .question-card-confirm-btn');
      for (var i = 0; i < allBtns.length; i++) {
        allBtns[i].disabled = true;
        allBtns[i].style.opacity = '0.5';
        allBtns[i].style.cursor = 'not-allowed';
      }
      var checkboxes = cardWrapper.querySelectorAll('.question-card-checkbox');
      for (var j = 0; j < checkboxes.length; j++) {
        checkboxes[j].disabled = true;
      }
      var input = cardWrapper.querySelector('.question-card-input');
      if (input) {
        input.disabled = true;
        input.style.opacity = '0.5';
      }
      resolve(value);
    }

    if (multiSelect) {
      var confirmBtn = cardWrapper.querySelector('.question-card-confirm-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
          var checkboxes = cardWrapper.querySelectorAll('.question-card-checkbox:checked');
          var selected = [];
          for (var k = 0; k < checkboxes.length; k++) {
            selected.push(checkboxes[k].getAttribute('data-option-value'));
          }
          resolveWith(selected);
        });
      }
    } else {
      var optionBtns = cardWrapper.querySelectorAll('.question-card-option-btn');
      for (var i = 0; i < optionBtns.length; i++) {
        optionBtns[i].addEventListener('click', function (e) {
          var val = e.target.getAttribute('data-option-value');
          resolveWith(val);
        });
      }
    }

    var submitBtn = cardWrapper.querySelector('.question-card-submit-btn');
    var inputEl = cardWrapper.querySelector('.question-card-input');
    if (submitBtn && inputEl) {
      submitBtn.addEventListener('click', function () {
        var val = inputEl.value.trim();
        if (val) resolveWith(val);
      });
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var val = inputEl.value.trim();
          if (val) resolveWith(val);
        }
      });
    }

    var abortHandler = function () {
      resolveWith(null);
    };
    if (currentAbortController && currentAbortController.signal) {
      currentAbortController.signal.addEventListener('abort', function () {
        if (!resolved) {
          var allBtns = cardWrapper.querySelectorAll('.question-card-option-btn, .question-card-submit-btn, .question-card-confirm-btn');
          for (var j = 0; j < allBtns.length; j++) {
            allBtns[j].disabled = true;
            allBtns[j].style.opacity = '0.5';
            allBtns[j].style.cursor = 'not-allowed';
          }
          var checkboxes = cardWrapper.querySelectorAll('.question-card-checkbox');
          for (var k = 0; k < checkboxes.length; k++) {
            checkboxes[k].disabled = true;
          }
          if (inputEl) {
            inputEl.disabled = true;
            inputEl.style.opacity = '0.5';
          }
        }
      });
    }
  });
}

function createAuthCard(action, detail, riskLevel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-auth-card';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-auth-card';

  const header = document.createElement('div');
  header.className = 'auth-card-header';
  header.textContent = '⚠️ ' + (t ? t('chat.authCardTitle') : '授权确认');

  const body = document.createElement('div');
  body.className = 'auth-card-body';

  const actionEl = document.createElement('div');
  actionEl.className = 'auth-card-action';
  actionEl.innerHTML = '<strong>' + (t ? t('chat.authCardActionLabel') : '操作') + '：</strong>' + htmlEscape(action);

  const detailEl = document.createElement('div');
  detailEl.className = 'auth-card-detail';
  detailEl.innerHTML = '<strong>' + (t ? t('chat.authCardDetailLabel') : '详情') + '：</strong>' + htmlEscape(detail);

  body.appendChild(actionEl);
  body.appendChild(detailEl);

  if (riskLevel) {
    const riskEl = document.createElement('div');
    riskEl.className = 'auth-card-risk auth-card-risk-' + riskLevel;
    riskEl.textContent = getRiskLevelText(riskLevel);
    body.appendChild(riskEl);
  }

  const actions = document.createElement('div');
  actions.className = 'auth-card-actions';

  const rejectBtn = document.createElement('button');
  rejectBtn.className = 'auth-btn auth-btn-reject';
  rejectBtn.textContent = '✕ ' + (t ? t('chat.authCardReject') : '拒绝');

  const approveBtn = document.createElement('button');
  approveBtn.className = 'auth-btn auth-btn-approve';
  approveBtn.textContent = '✓ ' + (t ? t('chat.authCardApprove') : '同意');

  actions.appendChild(rejectBtn);
  actions.appendChild(approveBtn);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(actions);
  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return wrapper;
}

function handleAuthCard(cardWrapper) {
  return new Promise(function (resolve, reject) {
    var resolved = false;

    var approveBtn = cardWrapper.querySelector('.auth-btn-approve');
    var rejectBtn = cardWrapper.querySelector('.auth-btn-reject');

    approveBtn.addEventListener('click', function () {
      if (resolved) return;
      resolved = true;
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      approveBtn.style.opacity = '0.5';
      rejectBtn.style.opacity = '0.5';
      approveBtn.style.cursor = 'not-allowed';
      rejectBtn.style.cursor = 'not-allowed';
      var statusEl = document.createElement('div');
      statusEl.className = 'auth-card-status auth-card-status-approved';
      statusEl.textContent = '✓ ' + (t ? t('chat.authCardApproved') : '已授权');
      cardWrapper.querySelector('.chat-bubble-auth-card').appendChild(statusEl);
      resolve({ authorized: true });
    });

    rejectBtn.addEventListener('click', function () {
      if (resolved) return;
      resolved = true;
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      approveBtn.style.opacity = '0.5';
      rejectBtn.style.opacity = '0.5';
      approveBtn.style.cursor = 'not-allowed';
      rejectBtn.style.cursor = 'not-allowed';
      var statusEl = document.createElement('div');
      statusEl.className = 'auth-card-status auth-card-status-rejected';
      statusEl.textContent = '✕ ' + (t ? t('chat.authCardRejected') : '已拒绝');
      cardWrapper.querySelector('.chat-bubble-auth-card').appendChild(statusEl);
      reject(new Error('auth_rejected'));
    });

    var abortHandler = function () {
      if (!resolved) {
        resolved = true;
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
        approveBtn.style.opacity = '0.5';
        rejectBtn.style.opacity = '0.5';
      }
    };
    if (currentAbortController && currentAbortController.signal) {
      currentAbortController.signal.addEventListener('abort', abortHandler);
    }
  });
}

function createTableCard(title, columns, rows, clickable) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-table-card';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-table-card';

  const header = document.createElement('div');
  header.className = 'table-card-header';
  header.textContent = '📊 ' + (title || (t ? t('chat.tableCardTitle') : '表格数据'));

  card.appendChild(header);

  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-card-table-container';

  const table = document.createElement('table');
  table.className = 'table-card-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (var c = 0; c < columns.length; c++) {
    var th = document.createElement('th');
    th.textContent = columns[c];
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (var r = 0; r < rows.length; r++) {
    var tr = document.createElement('tr');
    if (clickable) {
      tr.className = 'table-card-row-clickable';
      tr.setAttribute('data-row-index', r);
      tr.title = t ? t('chat.tableCardClickHint') : '点击行选择';
    }
    for (var c = 0; c < rows[r].length; c++) {
      var td = document.createElement('td');
      td.textContent = rows[r][c] != null ? rows[r][c] : '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  tableContainer.appendChild(table);

  card.appendChild(tableContainer);
  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return wrapper;
}

function handleTableCard(cardWrapper, clickable) {
  return new Promise(function (resolve, reject) {
    var resolved = false;

    function resolveWith(value) {
      if (resolved) return;
      resolved = true;
      var allRows = cardWrapper.querySelectorAll('.table-card-row-clickable');
      for (var i = 0; i < allRows.length; i++) {
        allRows[i].style.opacity = '0.5';
        allRows[i].style.cursor = 'not-allowed';
        allRows[i].style.pointerEvents = 'none';
      }
      resolve(value);
    }

    if (!clickable) {
      resolve({ displayed: true });
      return;
    }

    var rows = cardWrapper.querySelectorAll('.table-card-row-clickable');
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener('click', function (e) {
        var rowEl = e.currentTarget;
        var cells = rowEl.querySelectorAll('td');
        var selected = [];
        for (var j = 0; j < cells.length; j++) {
          selected.push(cells[j].textContent);
        }
        var statusEl = document.createElement('div');
        statusEl.className = 'table-card-status';
        statusEl.textContent = '✓ ' + (t ? t('chat.tableCardSelected') : '已选中');
        cardWrapper.querySelector('.chat-bubble-table-card').appendChild(statusEl);
        resolveWith({ selected: selected });
      });
    }

    if (currentAbortController && currentAbortController.signal) {
      currentAbortController.signal.addEventListener('abort', function () {
        if (!resolved) {
          resolveWith(null);
        }
      });
    }
  });
}

function downloadFileContent(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 500);
}

function createFileCard(fileName, content, mimeType) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-file-card';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-file-card';

  const header = document.createElement('div');
  header.className = 'file-card-header';
  header.textContent = '📁 ' + (fileName || (t ? t('chat.fileCardTitle') : '文件下载'));

  card.appendChild(header);

  const meta = document.createElement('div');
  meta.className = 'file-card-meta';
  meta.textContent = '📄 ' + (mimeType || 'text/plain');
  card.appendChild(meta);

  const previewText = content || '';
  const preview = previewText.length > 200 ? previewText.substring(0, 200) + '...' : previewText;
  const previewEl = document.createElement('pre');
  previewEl.className = 'file-card-preview';
  previewEl.textContent = preview;
  card.appendChild(previewEl);

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'file-card-download-btn';
  downloadBtn.textContent = '⬇ ' + (t ? t('chat.fileCardDownload') : '下载');
  downloadBtn.addEventListener('click', function () {
    downloadFileContent(fileName, content, mimeType);
    downloadBtn.textContent = '✓ ' + (t ? t('chat.fileCardDownloaded') : '已下载');
    downloadBtn.disabled = true;
  });
  card.appendChild(downloadBtn);

  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return wrapper;
}

function getMimeTypeFromPath(filePath) {
  const ext = (filePath || '').split('.').pop().toLowerCase();
  const map = {
    'json': 'application/json',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'ts': 'text/typescript',
    'md': 'text/markdown',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'svg': 'image/svg+xml',
    'txt': 'text/plain'
  };
  return map[ext] || 'text/plain';
}

function buildOccTree(files) {
  const tree = {};
  for (const f of files) {
    const parts = f.path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    if (!current._files) current._files = [];
    current._files.push(parts[parts.length - 1]);
  }
  return tree;
}

function renderOccFileRow(filePath, container) {
  const row = document.createElement('div');
  row.className = 'occ-file';

  const nameEl = document.createElement('span');
  nameEl.className = 'occ-file-name';
  nameEl.textContent = '📄 ' + (filePath.split('/').pop() || filePath);
  row.appendChild(nameEl);

  const previewBtn = document.createElement('button');
  previewBtn.className = 'occ-preview-btn';
  previewBtn.textContent = (t ? t('chat.outputCollectionCardPreview') : '预览');

  previewBtn.addEventListener('click', async function () {
    previewBtn.textContent = t ? t('chat.outputCollectionCardLoading') : '加载中...';
    previewBtn.disabled = true;
    try {
      const outputItem = typeof loadOutputItem === 'function' ? await loadOutputItem() : null;
      if (outputItem && typeof openFileModal === 'function') {
        await openFileModal(outputItem.id, filePath);
      }
    } catch (_) {
      // silent fail
    }
    previewBtn.textContent = t ? t('chat.outputCollectionCardPreview') : '预览';
    previewBtn.disabled = false;
  });

  row.appendChild(previewBtn);
  container.appendChild(row);
}

function renderOccTree(node, basePath, container) {
  const keys = Object.keys(node).sort();
  for (const key of keys) {
    if (key === '_files') {
      for (const fileName of node._files) {
        const fullPath = basePath ? basePath + '/' + fileName : fileName;
        renderOccFileRow(fullPath, container);
      }
    } else {
      const dirPath = basePath ? basePath + '/' + key : key;
      const details = document.createElement('details');
      details.className = 'occ-dir';
      details.open = true;

      const summary = document.createElement('summary');
      summary.className = 'occ-dir-name';
      summary.textContent = '📁 ' + key + '/';
      details.appendChild(summary);

      const dirContent = document.createElement('div');
      dirContent.className = 'occ-dir-content';
      renderOccTree(node[key], dirPath, dirContent);
      details.appendChild(dirContent);

      container.appendChild(details);
    }
  }
}

async function createOutputCollectionCard(options) {
  const pathPrefix = (options && options.pathPrefix) || '';
  const showTree = options && options.showTree !== false;
  const emptyMessage = (options && options.emptyMessage) || null;

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-output-collection-card';

  const card = document.createElement('div');
  card.className = 'chat-bubble chat-bubble-output-collection-card';

  const header = document.createElement('div');
  header.className = 'occ-header';
  header.textContent = '📦 ' + (t ? t('chat.outputCollectionCardTitle') : '工作产物');
  card.appendChild(header);

  var files = [];
  try {
    if (typeof searchOutputFiles === 'function') {
      files = await searchOutputFiles(pathPrefix);
    }
  } catch (_) {
    files = [];
  }

  var fileOnly = [];
  for (var i = 0; i < files.length; i++) {
    if (files[i].type === 'file') {
      fileOnly.push(files[i]);
    }
  }

  if (fileOnly.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'occ-empty';
    emptyEl.textContent = '📭 ' + (emptyMessage || (t ? t('chat.outputCollectionCardEmpty') : '暂无产物文件'));
    card.appendChild(emptyEl);
  } else {
    const fileList = document.createElement('div');
    fileList.className = 'occ-file-list';

    if (showTree) {
      const tree = buildOccTree(fileOnly);
      renderOccTree(tree, '', fileList);
    } else {
      for (var j = 0; j < fileOnly.length; j++) {
        renderOccFileRow(fileOnly[j].path, fileList);
      }
    }

    card.appendChild(fileList);

    const actions = document.createElement('div');
    actions.className = 'occ-actions';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'occ-download-btn';
    downloadBtn.textContent = (t ? t('chat.outputCollectionCardDownloadAll', { n: fileOnly.length }) : ('⬇ 下载全部 (' + fileOnly.length + '个文件)'));

    (function(filesToDownload) {
      downloadBtn.addEventListener('click', async function () {
        downloadBtn.textContent = t ? t('chat.outputCollectionCardDownloading') : '下载中...';
        downloadBtn.disabled = true;

        for (var k = 0; k < filesToDownload.length; k++) {
          try {
            var content = typeof getOutputFile === 'function' ? await getOutputFile(filesToDownload[k].path) : '';
            if (!content || (typeof content === 'string' && content.charAt(0) === '{')) {
              try {
                var parsed = JSON.parse(content);
                if (parsed.error) {
                  continue;
                }
              } catch (_) {}
            }
            var fileName = filesToDownload[k].path.split('/').pop() || 'file';
            var mimeType = getMimeTypeFromPath(fileName);
            downloadFileContent(fileName, content, mimeType);
            await new Promise(function(r) { setTimeout(r, 200); });
          } catch (_) {
            // skip file on error
          }
        }

        downloadBtn.textContent = '✓ ' + (t ? t('chat.outputCollectionCardDownloaded') : '下载完成');
      });
    })(fileOnly);

    actions.appendChild(downloadBtn);
    card.appendChild(actions);
  }

  wrapper.appendChild(card);
  chatMessagesEl.appendChild(wrapper);
  scrollToBottom(false);

  return fileOnly.length;
}

function maskAuthData(data) {
  if (!data) return data;
  const masked = JSON.parse(JSON.stringify(data));
  const maskToken = function (tokenObj) {
    if (!tokenObj || !tokenObj.value) return;
    const token = tokenObj.value;
    if (token.length > 12) {
      tokenObj.value = token.substring(0, 8) + '****' + token.substring(token.length - 4);
    } else {
      tokenObj.value = '****';
    }
  };
  maskToken(masked.localStorageToken);
  maskToken(masked.sessionStorageToken);
  maskToken(masked.domToken);
  if (masked.cookies) {
    masked.cookies = masked.cookies.map(function (c) {
      if (c.value && c.value.length > 12) {
        return { name: c.name, value: c.value.substring(0, 6) + '****' };
      }
      return { name: c.name, value: '****' };
    });
  }
  return masked;
}

function setSending(isSending) {
  _isSending = isSending;
  var attachBtn = document.getElementById('attachBtn');
  if (isSending) {
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    chatInputEl.disabled = true;
    if (attachBtn) attachBtn.disabled = true;
  } else {
    sendBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    chatInputEl.disabled = false;
    if (attachBtn) attachBtn.disabled = false;
  }
}

var slashPanel = null;
var slashSelectedIndex = -1;
var slashSkills = [];
var slashOriginalValue = '';
var slashKeyboardActive = false;

function createSlashPanel() {
  if (slashPanel) return;
  slashPanel = document.createElement('div');
  slashPanel.id = 'slashPanel';
  slashPanel.className = 'slash-panel';
  slashPanel.style.display = 'none';
  slashPanel.style.position = 'absolute';
  slashPanel.style.bottom = '100%';
  slashPanel.style.left = '0';
  slashPanel.style.right = '0';
  slashPanel.style.marginBottom = '4px';
  slashPanel.style.maxHeight = '240px';
  slashPanel.style.overflowY = 'auto';
  slashPanel.style.borderRadius = '8px';
  slashPanel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
  slashPanel.style.zIndex = '1000';
  var inputArea = chatInputEl.parentElement;
  if (inputArea) {
    inputArea.style.position = inputArea.style.position || 'relative';
    inputArea.appendChild(slashPanel);
  }

  slashPanel.addEventListener('mousemove', function () {
    slashKeyboardActive = false;
  });
}

function updateSlashPanelStyle() {
  if (!slashPanel) return;
  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  slashPanel.style.background = isDark ? '#1e1e2e' : '#ffffff';
  slashPanel.style.border = '1px solid ' + (isDark ? '#313244' : '#dce0e8');
  slashPanel.style.color = isDark ? '#cdd6f4' : '#4c4f69';
}

function showSlashPanel() {
  createSlashPanel();
  updateSlashPanelStyle();
  var registry = window.__getSkillRegistry();
  slashSkills = registry.getAll();
  renderSlashPanel('');
  slashPanel.style.display = 'block';
}

function hideSlashPanel() {
  if (slashPanel) {
    slashPanel.style.display = 'none';
  }
  slashSelectedIndex = -1;
}

function renderSlashPanel(filter) {
  if (!slashPanel) return;
  var registry = window.__getSkillRegistry();
  slashSkills = registry.getAll();
  var filtered = slashSkills;
  if (filter) {
    var lower = filter.toLowerCase();
    filtered = slashSkills.filter(function (s) {
      return s.id.toLowerCase().indexOf(lower) !== -1 || s.name.toLowerCase().indexOf(lower) !== -1;
    });
  }

  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  var html = '';
  if (filtered.length === 0) {
    html = '<div style="padding:12px 16px;font-size:13px;opacity:0.6;">' + t('chat.noMatchingSkill') + '</div>';
  } else {
    filtered.forEach(function (s, i) {
      var bg = i === slashSelectedIndex ? (isDark ? '#313244' : '#e6e9ef') : 'transparent';
      html += '<div class="slash-item" data-index="' + i + '" data-skill-id="' + s.id + '" style="padding:10px 16px;cursor:pointer;background:' + bg + ';display:flex;flex-direction:column;gap:2px;">';
      html += '<span style="font-size:13px;font-weight:600;">/' + s.id + '</span>';
      html += '<span style="font-size:11px;opacity:0.7;">' + (s.description || '') + '</span>';
      html += '</div>';
    });
  }
  slashPanel.innerHTML = html;
  slashSkills = filtered;

  slashPanel.querySelectorAll('.slash-item').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      if (slashKeyboardActive) return;
      slashPanel.querySelectorAll('.slash-item').forEach(function (e) {
        e.style.background = 'transparent';
      });
      el.style.background = isDark ? '#313244' : '#e6e9ef';
      var idx = parseInt(el.getAttribute('data-index'), 10);
      slashSelectedIndex = idx;
    });
    el.addEventListener('click', function () {
      slashKeyboardActive = false;
      var skillId = el.getAttribute('data-skill-id');
      selectSlashSkill(skillId);
    });
  });

  if (slashSelectedIndex >= 0) {
    var selectedEl = slashPanel.querySelector('.slash-item[data-index="' + slashSelectedIndex + '"]');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }
}

function activateSkill(skillId) {
  var registry = window.__getSkillRegistry();
  var all = registry.getAll();
  var skill = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === skillId) { skill = all[i]; break; }
  }
  if (!skill) {
    return { activated: false, error: 'skill not found: ' + skillId };
  }
  registry.activate(skillId);
  return {
    activated: true,
    skillId: skill.id,
    name: skill.name,
    prompt: skill.getPrompt ? skill.getPrompt() : (skill.prompt || '')
  };
}

function selectSlashSkill(skillId) {
  chatInputEl.value = '/' + skillId + ' ';
  activateSkill(skillId);
  hideSlashPanel();
  chatInputEl.focus();
}

chatInputEl.addEventListener('input', function () {
  var value = chatInputEl.value;

  (function () {
    var registry2 = window.__getSkillRegistry();
    var active2 = registry2.getActive();
    if (active2.length === 0) return;

    if (value.startsWith('/')) {
      var spIdx = value.indexOf(' ');
      var inputSkillId = spIdx > -1 ? value.substring(1, spIdx) : '';
      if (inputSkillId.length === 0) return;
      var matchedIds = {};
      for (var ai = 0; ai < active2.length; ai++) {
        if (active2[ai].id === inputSkillId) {
          matchedIds[active2[ai].id] = true;
        }
      }
      for (var aj = 0; aj < active2.length; aj++) {
        if (!matchedIds[active2[aj].id]) {
          registry2.deactivate(active2[aj].id);
        }
      }
    } else {
      for (var ak = 0; ak < active2.length; ak++) {
        registry2.deactivate(active2[ak].id);
      }
    }
  })();

  if (value.startsWith('/')) {
    var spaceIdx = value.indexOf(' ');
    var skillPart = spaceIdx > -1 ? value.substring(1, spaceIdx) : value.substring(1);
    if (spaceIdx > -1 && skillPart.length > 0) {
      hideSlashPanel();
      return;
    }
    if (!slashPanel || slashPanel.style.display === 'none') {
      slashOriginalValue = value;
      showSlashPanel();
    }
    var filter = skillPart;
    slashSelectedIndex = filter.length > 0 ? 0 : -1;
    renderSlashPanel(filter);
  } else {
    hideSlashPanel();
  }
});

chatInputEl.addEventListener('keydown', function (e) {
  if (!slashPanel || slashPanel.style.display === 'none') return;

  var skillPart = chatInputEl.value.substring(1);
  var spaceIdx = skillPart.indexOf(' ');
  if (spaceIdx > -1) skillPart = skillPart.substring(0, spaceIdx);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    slashKeyboardActive = true;
    slashSelectedIndex = Math.min(slashSelectedIndex + 1, slashSkills.length - 1);
    renderSlashPanel(skillPart);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    slashKeyboardActive = true;
    slashSelectedIndex = Math.max(slashSelectedIndex - 1, 0);
    renderSlashPanel(skillPart);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (slashSelectedIndex >= 0 && slashSelectedIndex < slashSkills.length) {
      selectSlashSkill(slashSkills[slashSelectedIndex].id);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    chatInputEl.value = slashOriginalValue;
    hideSlashPanel();
  }
});

var _isSending = false;

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

function isFileTypeAllowed(file) {
  var ext = '.' + (file.name || '').split('.').pop().toLowerCase();
  if (ALLOWED_EXTENSIONS.indexOf(ext) !== -1) return true;

  var mime = (file.type || '').toLowerCase();
  for (var i = 0; i < ALLOWED_MIME_TYPES.length; i++) {
    if (mime.startsWith(ALLOWED_MIME_TYPES[i])) return true;
  }

  return false;
}

function handleFileSelect(event) {
  var files = event.target.files;
  if (!files || files.length === 0) return;

  if (!window.pendingFiles) window.pendingFiles = [];

  if (window.pendingFiles.length + files.length > MAX_FILE_COUNT) {
    if (typeof showToast === 'function') showToast(t('chat.fileTooMany'));
    event.target.value = '';
    return;
  }

  var loadedCount = 0;
  var totalCount = files.length;

  for (var i = 0; i < files.length; i++) {
    (function (file) {
      if (!isFileTypeAllowed(file)) {
        if (typeof showToast === 'function') showToast(t('chat.fileUnsupportedType') + ': ' + file.name);
        loadedCount++;
        checkAllLoaded();
        return;
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        window.pendingFiles.push({
          name: file.name,
          size: file.size,
          content: e.target.result
        });
        loadedCount++;
        checkAllLoaded();
      };
      reader.onerror = function () {
        loadedCount++;
        checkAllLoaded();
      };
      reader.readAsText(file);
    })(files[i]);
  }

  function checkAllLoaded() {
    if (loadedCount >= totalCount) {
      renderFileTags();
    }
  }

  event.target.value = '';
}

function renderFileTags() {
  var container = document.getElementById('chatFileTags');
  if (!container) return;

  if (!window.pendingFiles) window.pendingFiles = [];

  container.innerHTML = '';

  if (window.pendingFiles.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';

  for (var i = 0; i < window.pendingFiles.length; i++) {
    (function (idx) {
      var file = window.pendingFiles[idx];

      var tag = document.createElement('span');
      tag.className = 'file-tag';

      var nameEl = document.createElement('span');
      nameEl.className = 'file-tag-name';
      nameEl.textContent = '📄 ' + file.name;

      var sizeEl = document.createElement('span');
      sizeEl.className = 'file-tag-size';
      sizeEl.textContent = formatFileSize(file.size);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'file-tag-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = t('chat.fileTagRemove');
      removeBtn.addEventListener('click', function () {
        window.pendingFiles.splice(idx, 1);
        renderFileTags();
      });

      tag.appendChild(nameEl);
      tag.appendChild(sizeEl);
      tag.appendChild(removeBtn);
      container.appendChild(tag);
    })(i);
  }
}

function buildFileUploadHint() {
  if (!window.pendingFiles || window.pendingFiles.length === 0) return '';

  var sid = window.currentSessionId;
  var lines = ['用户提交了以下文件到「用户聊天提交文件」卡片中，请使用 get_user_file 工具读取文件内容：', ''];

  for (var i = 0; i < window.pendingFiles.length; i++) {
    lines.push('- ' + sid + '/' + window.pendingFiles[i].name);
  }

  lines.push('');
  return lines.join('\n');
}

async function savePendingFiles() {
  if (!window.pendingFiles || window.pendingFiles.length === 0) return;

  var sid = window.currentSessionId;
  for (var i = 0; i < window.pendingFiles.length; i++) {
    var item = window.pendingFiles[i];
    try {
      await saveUserFile(sid + '/' + item.name, item.content);
    } catch (e) {
      console.error('[savePendingFiles] Failed to save:', item.name, e);
    }
  }
}

function sendChatMessage() {
  const text = chatInputEl.value.trim();
  if (!text || _isSending) return;

  chatInputEl.value = '';

  if (typeof toggleSidebar === 'function') {
    var sidebar = document.getElementById('chatSidebar');
    if (sidebar && !sidebar.classList.contains('chat-sidebar--collapsed')) {
      toggleSidebar();
    }
  }

  if (!window.currentSessionId) {
    if (typeof SessionManager !== 'undefined') {
      _isSending = true;
      setSending(true);
      SessionManager.createSession().then(function (session) {
        window.currentSessionId = session.id;
        window.currentSessionMessages = [];
        window.chatMessages = [];
        try {
          if (typeof hideWelcomePage === 'function') hideWelcomePage();
          var truncatedTitle = session.title || (text.replace(/[\/\\:*?"<>|]/g, '').trim().substring(0, 15));
          if (typeof updateSessionTitleDisplay === 'function') updateSessionTitleDisplay(truncatedTitle);
        } catch (e) {
          console.error('[sendChatMessage] ui error:', e);
        }
        SessionManager.setInitialTitle(session.id, text).then(function () {
          if (typeof renderSessionList === 'function') renderSessionList();
          doSendMessage(text).catch(function (err) {
            console.error('[doSendMessage] error:', err);
            _isSending = false;
            setSending(false);
          });
        });
      }).catch(function (err) {
        console.error('[sendMessage] createSession error:', err);
        _isSending = false;
        setSending(false);
      });
      return;
    }
  }

  _isSending = true;
  setSending(true);
  if (typeof hideWelcomePage === 'function') hideWelcomePage();
  doSendMessage(text).catch(function (err) {
    console.error('[doSendMessage] error:', err);
    _isSending = false;
    setSending(false);
  });
}

async function doSendMessage(text) {
  console.log('[doSendMessage] start, text:', text);

  var fileHint = buildFileUploadHint();
  var finalText = fileHint ? fileHint + text : text;

  await savePendingFiles();

  var registry = window.__getSkillRegistry();
  var active = registry.getActive();
  window.__lastActiveSkills = active.map(function (s) {
    return { id: s.id, name: s.name, description: s.description, prompt: s.getPrompt ? s.getPrompt() : '' };
  });
  active.forEach(function (s) {
    registry.deactivate(s.id);
  });

  if (window.__lastActiveSkills.length > 0) {
    window.__lastActiveSkills.forEach(function (skill) {
      createSkillActivationCard(skill);
    });
  }

  appendMessageBubble('user', finalText, true);
  var msgs = getCurrentSessionMessages();
  if (window.__lastActiveSkills.length > 0) {
    window.__lastActiveSkills.forEach(function (skill) {
      msgs.push({ role: 'skill_activation', skillId: skill.id, skillName: skill.name, skillDescription: skill.description || '', timestamp: Date.now() });
    });
  }
  msgs.push({ role: 'user', content: finalText });
  await saveCurrentMessages();

  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  startAgentLoop(finalText, signal);
}

async function startAgentLoop(userMessage, signal) {
  let messages = await buildMessages(userMessage);
  let toolRound = 0;
  let currentReasoningContent = '';
  let lastToolCalls = [];
  activeToolCards = [];
  const MAX_REPEATED_CALLS = 5;
  const maxToolRounds = await getMaxToolRounds();
  const infoEl = createInfoBubble(t('chat.analyzing'));
  const infoTextEl = infoEl.querySelector('.info-text');

  while (toolRound < maxToolRounds) {
    if (signal.aborted) return;

    let toolCalls = [];
    let contentReceived = false;
    let streamedReasoning = '';

    const aiBubbleEl = appendMessageBubble('assistant', '', true);
    const bubbleTextEl = aiBubbleEl.querySelector('.chat-bubble');

    let thinkingEl = null;
    let thinkingTextEl = null;

    try {
      const result = await streamLLM(
        messages,
        signal,
        (token) => {
          if (token) {
            const currentText = bubbleTextEl.textContent + token;
            updateAIBubble(bubbleTextEl, currentText);
            scrollToBottom(false);
            contentReceived = true;
          }
        },
        (toolCallChunks) => {
          toolCalls = toolCallChunks;
        },
        (reasoning) => {
          streamedReasoning += reasoning;
          if (!thinkingEl) {
            thinkingEl = createThinkingBubble();
            thinkingTextEl = thinkingEl.querySelector('.thinking-content');
            thinkingEl.classList.add('thinking-active');
            var thinkingLabelEl = thinkingEl.querySelector('.thinking-label');
            if (thinkingLabelEl) {
              thinkingLabelEl.textContent = t('chat.thinkingActive');
            }
          }
          if (thinkingTextEl) {
            thinkingTextEl.textContent = streamedReasoning;
            scrollToBottom(false);
          }
        }
      );

      console.log('startAgentLoop: streamLLM result =', JSON.stringify({ reasoningContent: result?.reasoningContent?.substring(0, 80), toolCalls: toolCalls.length }));
      if (result?.reasoningContent) {
        currentReasoningContent = result.reasoningContent;
      }
    } catch (err) {
      console.error('AI chat error:', err);
      if (infoEl) infoEl.remove();
      if (thinkingEl) thinkingEl.remove();
      if (err.name === 'AbortError' || err instanceof DOMException) {
        if (bubbleTextEl.textContent) {
          var msgs = getCurrentSessionMessages();
          msgs.push({ role: 'assistant', content: bubbleTextEl.textContent });
          await saveCurrentMessages();
        }
        setSending(false);
        return;
      }
      aiBubbleEl.remove();
      let errorMsg = t('chat.requestFailed');
      if (err.message) {
        const msg = err.message;
        if (msg.includes('401') || msg.includes('403')) {
          errorMsg = t('chat.authError');
        } else if (msg.includes('402')) {
          errorMsg = t('chat.insufficientBalance');
          showErrorBubble(errorMsg);
          appendMessageBubble('assistant', t('chat.insufficientBalanceReminder'), true);
          var msgs402 = getCurrentSessionMessages();
          msgs402.push({ role: 'assistant', content: t('chat.insufficientBalanceReminder') });
          saveCurrentMessages();
          setSending(false);
          return;
        } else if (msg.includes('404')) {
          errorMsg = t('chat.notFound');
        } else if (msg.includes('timeout')) {
          errorMsg = t('chat.timeout');
        } else if (msg === t('chat.notConfigured')) {
          errorMsg = msg;
        } else {
          errorMsg = t('chat.errorPrefix') + msg;
          const diagParts = [];
          var currentMsgs = getCurrentSessionMessages();
          const hasReasoning = currentMsgs.some(m => m.role === 'assistant' && m.reasoning_content);
          diagParts.push(t('chat.diagReasoning') + hasReasoning);
          if (hasReasoning) {
            const last = [...currentMsgs].reverse().find(m => m.role === 'assistant' && m.reasoning_content);
            diagParts.push(t('chat.diagLength') + (last?.reasoning_content?.length || 0));
          }
          diagParts.push(t('chat.diagBodyReasoning') + (window._lastBodyHadReasoning ? t('common.yes') : t('common.no')));
          diagParts.push(t('chat.diagMsgCount') + (window._lastMsgCount || 0));
          errorMsg += '\n' + t('chat.diagnostic') + diagParts.join(' | ');
        }
      }
      showErrorBubble(errorMsg);
      setSending(false);
      return;
    }

    if (toolCalls.length > 0) {
      if (currentReasoningContent && thinkingTextEl && !thinkingTextEl.textContent) {
        thinkingTextEl.textContent = currentReasoningContent.substring(0, 500);
      }
      if (thinkingEl) {
        if (thinkingTextEl) {
          thinkingTextEl.textContent = currentReasoningContent || streamedReasoning;
          thinkingEl.classList.add('thinking-collapsed');
          thinkingEl.classList.remove('thinking-active');
          var thinkingLabelEl2 = thinkingEl.querySelector('.thinking-label');
          if (thinkingLabelEl2) {
            thinkingLabelEl2.textContent = t('chat.thinkingLabel');
          }
        }
      }

      var repeatedCount = 0;
      var firstTcName = toolCalls[0]?.function?.name;
      var firstTcArgs = toolCalls[0]?.function?.arguments;
      for (var tci = 1; tci < toolCalls.length; tci++) {
        if (toolCalls[tci].function?.name === firstTcName && toolCalls[tci].function?.arguments === firstTcArgs) {
          repeatedCount++;
        }
      }
      if (repeatedCount >= 3) {
        if (infoEl) infoEl.remove();
        if (thinkingEl) thinkingEl.remove();
        aiBubbleEl.remove();
        showErrorBubble(t('chat.repeatedToolStop'));
        setSending(false);
        return;
      }

      autoCollapseToolCards();

      var groupedCard = null;
      if (toolCalls.length > 1) {
        groupedCard = createGroupedToolCard(toolCalls);
        activeToolCards.push(groupedCard);
      }

      for (var tci = 0; tci < toolCalls.length; tci++) {
        var tc = toolCalls[tci];
        const argsObj = safeParseArgs(tc.function.arguments);

        var isInteractiveTool = tc.function.name === 'ask_user' || tc.function.name === 'request_auth';

        if (groupedCard) {
          updateGroupedSubItem(groupedCard, tci, 'executing', { args: argsObj });
        } else if (!isInteractiveTool) {
          var cardData = createCollapsibleToolCard(tc.function.name);
          activeToolCards.push(cardData);
          setCardState(cardData, 'executing', { args: argsObj });
        }

        var callKey = tc.function.name + ':' + (tc.function.arguments || '');
        lastToolCalls.push(callKey);
        if (lastToolCalls.length > MAX_REPEATED_CALLS) lastToolCalls.shift();

        if (lastToolCalls.length >= MAX_REPEATED_CALLS) {
          var allSame = true;
          for (var li = 1; li < lastToolCalls.length; li++) {
            if (lastToolCalls[li] !== lastToolCalls[0]) { allSame = false; break; }
          }
          if (allSame) {
            if (infoEl) infoEl.remove();
            if (thinkingEl) thinkingEl.remove();
            aiBubbleEl.remove();
            showErrorBubble(t('chat.repeatedToolStopN', { n: MAX_REPEATED_CALLS }));
            setSending(false);
            return;
          }
        }

        const assistantMsg = {
          role: 'assistant',
          content: tc.function.name ? null : '',
          tool_calls: [tc],
        };
        if (currentReasoningContent) {
          assistantMsg.reasoning_content = currentReasoningContent;
        }
        var msgs2 = getCurrentSessionMessages();
        msgs2.push(assistantMsg);
        messages.push(assistantMsg);

        const toolResult = await executeToolCall(tc.function.name, tc.function.arguments);
        const toolMsg = {
          role: 'tool',
          tool_call_id: tc.id,
          content: toolResult,
        };
        messages.push(toolMsg);
        msgs2.push(toolMsg);
        await saveCurrentMessages();
        if (groupedCard) {
          updateGroupedSubItem(groupedCard, tci, 'completed', { result: toolResult });
        } else if (!isInteractiveTool) {
          setCardState(cardData, 'completed', { result: toolResult });
        }
      }

      if (groupedCard) {
        autoCollapseGroupCard(groupedCard);
      }

      if (infoTextEl) {
        infoTextEl.textContent = t('chat.toolCallRound', { round: toolRound + 1 });
      }

      toolRound++;
      continue;
    }

    if (thinkingEl && thinkingTextEl) {
      thinkingTextEl.textContent = currentReasoningContent || streamedReasoning;
      thinkingEl.classList.add('thinking-collapsed');
      thinkingEl.classList.remove('thinking-active');
      var thinkingLabelEl3 = thinkingEl.querySelector('.thinking-label');
      if (thinkingLabelEl3) {
        thinkingLabelEl3.textContent = t('chat.thinkingLabel');
      }
    }
    if (infoEl) infoEl.remove();

    const finalText = bubbleTextEl.textContent;

    var handledBySkill = false;
    var registry = window.__getSkillRegistry();
    var all = registry.getAll();
    for (var si = 0; si < all.length; si++) {
      var delegate = all[si].getUIDelegate ? all[si].getUIDelegate() : null;
      if (delegate && delegate.onMessageParsed) {
        if (delegate.onMessageParsed(aiBubbleEl, finalText, bubbleTextEl, currentReasoningContent)) {
          handledBySkill = true;
          break;
        }
      }
    }
    if (handledBySkill) {
      window.pendingFiles = [];
      renderFileTags();
      setSending(false);
      return;
    }

    bubbleTextEl.innerHTML = renderMarkdown(finalText);
    scrollToBottom(false);

    const historyMsg = { role: 'assistant', content: finalText };
    if (currentReasoningContent) {
      historyMsg.reasoning_content = currentReasoningContent;
      console.log('startAgentLoop: saving assistant msg with reasoning_content, length =', currentReasoningContent.length);
    } else {
      console.log('startAgentLoop: saving assistant msg WITHOUT reasoning_content');
    }
    var currentMsgs3 = getCurrentSessionMessages();
    currentMsgs3.push(historyMsg);
    await saveCurrentMessages();

    if (typeof triggerMemoryGeneration === 'function') {
      var memoryMsgs = getCurrentSessionMessages();
      var hostname = typeof getCurrentHostname === 'function' ? getCurrentHostname() : 'general';
      var memoryTitle = '';
      var sid2 = window.currentSessionId;
      if (sid2 && typeof SessionManager !== 'undefined') {
        try {
          var session = await SessionManager.getSession(sid2);
          if (session && session.title) memoryTitle = session.title;
        } catch {}
      }
      if (!memoryTitle) {
        var firstUserMsg = memoryMsgs.find(function (m) { return m.role === 'user'; });
        memoryTitle = firstUserMsg ? (firstUserMsg.content || '').substring(0, 50) : '对话';
      }
      triggerMemoryGeneration(memoryMsgs, hostname, memoryTitle, sid2);
    }

    var sid = window.currentSessionId;
    if (sid && typeof SessionManager !== 'undefined') {
      try {
        var session = await SessionManager.getSession(sid);
        if (session && session.titleSource === 'truncated') {
          SessionManager._clearTitleTimer(sid);
          var userMsg = getCurrentSessionMessages()[0];
          var userText = userMsg ? userMsg.content : '';
          var newTitle = await SessionManager.generateSessionTitle(sid, userText, finalText);
          if (newTitle) {
            var titleEl = document.getElementById('sessionTitleDisplay');
            if (titleEl) titleEl.textContent = newTitle;
            var card = document.querySelector('.session-card[data-session-id="' + sid + '"]');
            if (card) {
              var cardTitle = card.querySelector('.session-card__title');
              if (cardTitle) cardTitle.textContent = newTitle;
            }
            if (typeof renderSessionList === 'function') renderSessionList();
          }
        }
      } catch {}
    }

    window.pendingFiles = [];
    renderFileTags();
    setSending(false);
    return;
  }

  if (infoEl) infoEl.remove();
  const maxRoundBubble = appendMessageBubble('assistant', t('chat.maxRoundsReached', { max: maxToolRounds }), true);
  var msgs4 = getCurrentSessionMessages();
  msgs4.push({ role: 'assistant', content: t('chat.maxRoundsReached2', { max: maxToolRounds }) });
  await saveCurrentMessages();
  setSending(false);
}

async function executeToolCall(name, argsStr) {
  if (name === 'activate_skill') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      var result = activateSkill(args.skillId);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: 'activate_skill failed: ' + (err.message || '') });
    }
  }

  if (name === 'search_project_code') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof searchProjectCode === 'function') {
        return await searchProjectCode(args.knowledgeId, args.keyword);
      }
      return JSON.stringify({ error: t('aiContext.resourceUnavailable') });
    } catch (err) {
      return JSON.stringify({ error: t('aiContext.searchFailed') + (err.message || t('common.unknownError')) });
    }
  }

  if (name === 'get_project_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof getProjectFile === 'function') {
        return await getProjectFile(args.knowledgeId, args.filePath);
      }
      return JSON.stringify({ error: t('aiContext.resourceUnavailable') });
    } catch (err) {
      return JSON.stringify({ error: t('aiContext.getFileFailed') + (err.message || t('common.unknownError')) });
    }
  }

  if (name === 'list_project_files') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof listProjectFiles === 'function') {
        return await listProjectFiles(args.knowledgeId, args.directoryPath, args.depth);
      }
      return JSON.stringify({ error: t('aiContext.resourceUnavailable') });
    } catch (err) {
      return JSON.stringify({ error: t('aiContext.listFailed') + (err.message || t('common.unknownError')) });
    }
  }

  if (name === 'search_memories') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof searchMemories === 'function') {
        const result = await searchMemories(args.domain);
        return JSON.stringify(result);
      }
      return JSON.stringify({ error: '记忆查询功能不可用' });
    } catch (err) {
      return JSON.stringify({ error: '查询记忆失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_memory_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof getMemoryFile === 'function') {
        return await getMemoryFile(args.path || args.filePath);
      }
      return JSON.stringify({ error: '记忆读取功能不可用' });
    } catch (err) {
      return JSON.stringify({ error: '读取记忆文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'save_memory_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof saveMemoryFile !== 'function') {
        return JSON.stringify({ error: '记忆存储功能不可用' });
      }
      var hostname = typeof getCurrentHostname === 'function' ? getCurrentHostname() : 'general';
      var content = args.content;
      if (!content || typeof content !== 'string') {
        return JSON.stringify({ error: '缺少 content 参数或格式错误' });
      }
      var fileName = '记忆文件';
      if (args.filePath) {
        var pathParts = args.filePath.replace(/\.md$/i, '').split('/');
        if (pathParts.length >= 2) {
          hostname = pathParts[0];
          fileName = pathParts[pathParts.length - 1];
        } else {
          fileName = pathParts[0];
        }
      }
      var savedPath = await saveMemoryFile(hostname, fileName, content, fileName);
      return JSON.stringify({ success: true, path: savedPath, message: '记忆文件已保存: ' + savedPath });
    } catch (err) {
      return JSON.stringify({ error: '保存记忆文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'save_output_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof saveOutputFile !== 'function') {
        return JSON.stringify({ error: '工作产物存储功能不可用' });
      }
      if (!args.filePath) {
        return JSON.stringify({ error: '缺少 filePath 参数' });
      }
      if (!args.content) {
        return JSON.stringify({ error: '缺少 content 参数' });
      }
      var savedPath = await saveOutputFile(args.filePath, args.content);
      return JSON.stringify({ success: true, path: savedPath, message: '产物文件已保存: ' + savedPath });
    } catch (err) {
      return JSON.stringify({ error: '保存产物文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_output_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof getOutputFile !== 'function') {
        return JSON.stringify({ error: '工作产物读取功能不可用' });
      }
      return await getOutputFile(args.filePath);
    } catch (err) {
      return JSON.stringify({ error: '读取产物文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'search_output_files') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof searchOutputFiles !== 'function') {
        return JSON.stringify({ error: '工作产物查询功能不可用' });
      }
      const result = await searchOutputFiles(args.pathPrefix);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '查询产物文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'search_user_files') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof searchUserFiles !== 'function') {
        return JSON.stringify({ error: '用户提交文件查询功能不可用' });
      }
      const result = await searchUserFiles(args.pathPrefix);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '查询用户提交文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_user_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      if (typeof getUserFile !== 'function') {
        return JSON.stringify({ error: '用户提交文件读取功能不可用' });
      }
      return await getUserFile(args.filePath);
    } catch (err) {
      return JSON.stringify({ error: '读取用户提交文件失败: ' + (err.message || '') });
    }
  }

  if (name === 'ask_user') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const question = args.question || '';
      const options = args.options || [];
      const allowFreeInput = args.allowFreeInput === true;
      const placeholder = args.placeholder || '';
      const multiSelect = args.multiSelect === true;
      const cardWrapper = createQuestionCard(question, options.length > 0 ? options : null, allowFreeInput, placeholder, multiSelect);
      const userResponse = await handleQuestionCard(cardWrapper, options, allowFreeInput, multiSelect);
      return JSON.stringify({ answer: userResponse });
    } catch (err) {
      return JSON.stringify({ error: '提问被取消: ' + (err.message || '') });
    }
  }

  if (name === 'request_auth') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const action = args.action || '';
      const detail = args.detail || '';
      const riskLevel = args.riskLevel || '';
      const cardWrapper = createAuthCard(action, detail, riskLevel);
      const result = await handleAuthCard(cardWrapper);
      return JSON.stringify(result);
    } catch (err) {
      if (err.message === 'auth_rejected') {
        if (currentAbortController) {
          currentAbortController.abort();
        }
        createInfoBubble(typeof window.t === 'function' ? window.t('chat.authSessionStopped') : '用户拒绝授权，会话已停止');
        setSending(false);
        return JSON.stringify({ authorized: false, reason: 'user_rejected' });
      }
      return JSON.stringify({ error: '授权请求失败: ' + (err.message || '') });
    }
  }

  if (name === 'display_table') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const title = args.title || '';
      const columns = args.columns || [];
      const rows = args.rows || [];
      const clickable = args.clickable === true;
      const cardWrapper = createTableCard(title, columns, rows, clickable);
      const result = await handleTableCard(cardWrapper, clickable);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '表格展示失败: ' + (err.message || '') });
    }
  }

  if (name === 'provide_file') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const fileName = args.fileName || 'download.txt';
      const content = args.content || '';
      const mimeType = args.mimeType || 'text/plain';
      createFileCard(fileName, content, mimeType);
      return JSON.stringify({ displayed: true, fileName: fileName });
    } catch (err) {
      return JSON.stringify({ error: '文件提供失败: ' + (err.message || '') });
    }
  }

  if (name === 'present_output_files') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const pathPrefix = args.pathPrefix || '';
      const showTree = args.showTree !== false;
      const emptyMessage = args.emptyMessage || null;

      const fileCount = await createOutputCollectionCard({ pathPrefix: pathPrefix, showTree: showTree, emptyMessage: emptyMessage });

      return JSON.stringify({ displayed: true, fileCount: fileCount });
    } catch (err) {
      return JSON.stringify({ error: '产物集合展示失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_page_context') {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ error: '获取页面上下文失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_page_interactive_elements') {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'GET_PAGE_INTERACTIVE_ELEMENTS' }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ error: '获取页面交互元素失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_page_css') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'GET_PAGE_CSS',
          selector: args.selector || '',
          mode: args.mode || 'computed',
          maxLength: args.maxLength || 50000
        }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ error: '获取页面CSS失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_page_source') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'GET_PAGE_SOURCE',
          selector: args.selector || '',
          maxLength: args.maxLength || 50000
        }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ error: '获取页面源码失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_page_js') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'GET_PAGE_JS',
          mode: args.mode || 'inline',
          maxLength: args.maxLength || 50000
        }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ error: '获取页面JS失败: ' + (err.message || '') });
    }
  }

  if (name === 'refresh_page') {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'REFRESH_PAGE' }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ error: '刷新页面失败: ' + (err.message || '') });
    }
  }

  if (name === 'click_element') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const selector = args.selector;
      const timeout = args.timeout || 3000;

      const result = await new Promise((resolve, reject) => {
        var timeoutId = setTimeout(() => {
          cleanup();
          resolve({ success: false, error: 'timeout', message: '点击操作超时，未在30秒内收到结果' });
        }, 30000);

        var listener = function (message) {
          if (message.type === 'CLICK_ELEMENT_RESULT') {
            cleanup();
            resolve(message.data || message);
          }
        };

        var cleanup = function () {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(listener);
        };

        chrome.runtime.onMessage.addListener(listener);

        chrome.runtime.sendMessage({ type: 'CLICK_ELEMENT', data: { selector: selector, timeout: timeout } }, (response) => {
          if (chrome.runtime.lastError) {
            cleanup();
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.type === 'CLICK_ELEMENT_ERROR') {
            cleanup();
            resolve(response.data);
          }
        });
      });

      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ success: false, error: 'click_error', message: '点击失败: ' + (err.message || '') });
    }
  }

  if (name === 'input_text') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const selector = args.selector;
      const text = args.text;

      if (!selector || text === undefined || text === null) {
        return JSON.stringify({ success: false, error: 'bad_request', message: '缺少必要参数 selector 或 text' });
      }

      const result = await new Promise((resolve, reject) => {
        var timeoutId = setTimeout(() => {
          cleanup();
          resolve({ success: false, error: 'timeout', message: '输入操作超时，未在30秒内收到结果' });
        }, 30000);

        var listener = function (message) {
          if (message.type === 'INPUT_TEXT_RESULT') {
            cleanup();
            resolve(message.data || message);
          }
        };

        var cleanup = function () {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(listener);
        };

        chrome.runtime.onMessage.addListener(listener);

        chrome.runtime.sendMessage({ type: 'INPUT_TEXT', data: { selector: selector, text: text } }, (response) => {
          if (chrome.runtime.lastError) {
            cleanup();
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.type === 'INPUT_TEXT_ERROR') {
            cleanup();
            resolve(response.data);
          }
        });
      });

      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ success: false, error: 'input_error', message: '输入失败: ' + (err.message || '') });
    }
  }

  if (name === 'execute_request') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const url = args.url;
      const method = args.method;
      const headers = args.headers;
      const body = args.body;

      const result = await new Promise((resolve, reject) => {
        var timeoutId = setTimeout(() => {
          cleanup();
          resolve({ error: { type: 'timeout', message: '请求超时，未在35秒内收到结果' } });
        }, 35000);

        var listener = function (message) {
          if (message.type === 'EXECUTE_REQUEST_RESULT') {
            cleanup();
            resolve(message.data || message);
          }
        };

        var cleanup = function () {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(listener);
        };

        chrome.runtime.onMessage.addListener(listener);

        chrome.runtime.sendMessage({ type: 'EXECUTE_REQUEST', data: { url: url, method: method, headers: headers, body: body } }, (response) => {
          if (chrome.runtime.lastError) {
            cleanup();
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.type === 'EXECUTE_REQUEST_ERROR') {
            cleanup();
            resolve({ error: response.error, message: response.message });
          }
        });
      });

      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: 'execute_request_failed', message: '请求执行失败: ' + (err.message || '') });
    }
  }

  if (name === 'create_skill_collection') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const result = await FavoritesManager.createCollection(args.name || '', args.description || '', args.skillIds || []);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '创建收藏夹失败: ' + (err.message || '') });
    }
  }

  if (name === 'delete_skill_collection') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const result = await FavoritesManager.deleteCollection(args.collectionId || '');
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '删除收藏夹失败: ' + (err.message || '') });
    }
  }

  if (name === 'add_skills_to_collection') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const result = await FavoritesManager.addSkills(args.collectionId || '', args.skillIds || []);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '添加技能失败: ' + (err.message || '') });
    }
  }

  if (name === 'remove_skills_from_collection') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const result = await FavoritesManager.removeSkills(args.collectionId || '', args.skillIds || []);
      return JSON.stringify(result);
    } catch (err) {
      return JSON.stringify({ error: '移除技能失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_captured_requests') {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'QUERY_REQUESTS_FOR_AI' }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      if (response && response.type === 'REQUESTS_FOR_AI_DATA') {
        return JSON.stringify(response.data || []);
      }
      return JSON.stringify([]);
    } catch (err) {
      return JSON.stringify({ error: '获取请求列表失败: ' + (err.message || '') });
    }
  }

  if (name === 'get_captured_request_detail') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'QUERY_REQUEST_DETAIL', requestId: args.requestId }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      if (response && response.type === 'REQUEST_DETAIL') {
        return JSON.stringify(response.data);
      }
      if (response && response.type === 'REQUEST_DETAIL_ERROR') {
        return JSON.stringify({ error: response.error, message: response.message });
      }
      return JSON.stringify({ error: '请求详情不存在' });
    } catch (err) {
      return JSON.stringify({ error: '获取请求详情失败: ' + (err.message || '') });
    }
  }

  if (name === 'navigate_to_url') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const url = args.url;
      if (!url || typeof url !== 'string') {
        return JSON.stringify({ success: false, error: '缺少 url 参数' });
      }
      if (!/^https?:\/\//i.test(url)) {
        return JSON.stringify({ success: false, error: '无效的 URL 格式，URL 必须以 http:// 或 https:// 开头' });
      }
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'NAVIGATE_TO_URL', data: { url: url } }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ success: false, error: '导航页面失败: ' + (err.message || '') });
    }
  }

  if (name === 'open_new_tab') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const url = args.url || '';
      if (url && !/^https?:\/\//i.test(url)) {
        return JSON.stringify({ success: false, error: '无效的 URL 格式，URL 必须以 http:// 或 https:// 开头' });
      }
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'OPEN_NEW_TAB', data: { url: url } }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ success: false, error: '打开新标签页失败: ' + (err.message || '') });
    }
  }

  if (name === 'switch_to_tab') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const tabId = args.tabId;
      const urlPattern = args.urlPattern;
      if (!tabId && !urlPattern) {
        return JSON.stringify({ success: false, error: '需要提供 tabId 或 urlPattern 参数' });
      }
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'SWITCH_TO_TAB', data: { tabId: tabId, urlPattern: urlPattern } }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ success: false, error: '切换标签页失败: ' + (err.message || '') });
    }
  }

  if (name === 'close_tab') {
    try {
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : (argsStr || {});
      const tabId = args.tabId;
      if (!tabId) {
        return JSON.stringify({ success: false, error: '缺少 tabId 参数' });
      }
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'CLOSE_TAB', data: { tabId: tabId } }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ success: false, error: '关闭标签页失败: ' + (err.message || '') });
    }
  }

  if (name === 'list_tabs') {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'LIST_TABS' }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      });
      return JSON.stringify(response.data);
    } catch (err) {
      return JSON.stringify({ success: false, error: '获取标签页列表失败: ' + (err.message || '') });
    }
  }

  return JSON.stringify({ error: window.t ? window.t('chat.unknownTool') + name : '未知工具: ' + name });
}

async function getStaticSystemPrompt() {
  if (typeof window.getAgentsMd === 'function') {
    var record = await window.getAgentsMd();
    if (record && record.content) {
      return record.content;
    }
  }
  return '';
}

async function buildMessages(userMessage) {
  var currentMsgs = getCurrentSessionMessages();
  console.log('buildMessages: chatMessages length =', currentMsgs ? currentMsgs.length : 0);

  const staticPrompt = await getStaticSystemPrompt();
  const context = await buildRequestContext();
  const skillDir = buildSkillDirectory();
  const activeSkillPrompt = buildActiveSkillPrompt();
  const knowledgeContext = await buildKnowledgeContext();
  const memoryHint = await buildMemoryHint();

  const msgs = [];

  let systemContent = '';
  if (staticPrompt) systemContent += staticPrompt;
  if (context) systemContent += (systemContent ? '\n\n' : '') + context;
  if (memoryHint) systemContent += '\n\n' + memoryHint;
  if (skillDir) systemContent += '\n\n' + skillDir;
  if (activeSkillPrompt) systemContent += '\n\n' + activeSkillPrompt;
  if (systemContent) {
    msgs.push({ role: 'system', content: systemContent });
  }

  if (knowledgeContext) {
    msgs.push({ role: 'system', content: knowledgeContext });
  }

  var currentMsgs2 = getCurrentSessionMessages();
  const recentHistory = currentMsgs2.slice(-21, -1);
  for (const h of recentHistory) {
    if (h.role === 'skill_activation') {
      continue;
    }
    if (h.role === 'tool') {
      var lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.tool_calls) {
        continue;
      }
    }
    let content = h.content || '';
    if (content.length > 2000) {
      content = content.substring(0, 2000) + '...' + t('chat.truncated');
    }
    const entry = { role: h.role, content: content };
    if (h.role === 'assistant' && h.reasoning_content) {
      entry.reasoning_content = h.reasoning_content;
      console.log('buildMessages: including reasoning_content for assistant msg, length =', h.reasoning_content.length);
    } else if (h.role === 'assistant' && !h.reasoning_content) {
      console.log('buildMessages: assistant msg MISSING reasoning_content');
    }
    if (h.tool_calls) {
      entry.tool_calls = h.tool_calls;
    }
    if (h.tool_call_id) {
      entry.tool_call_id = h.tool_call_id;
    }
    msgs.push(entry);
  }
  console.log('buildMessages: history entries =', recentHistory.length, 'total messages =', msgs.length + 1);

  msgs.push({ role: 'user', content: userMessage });

  window.__lastActiveSkills = null;

  return msgs;
}

async function buildRequestContext() {
  let urlInfo = '';
  let requestInfo = '';

  try {
    const urlResp = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('timeout')), 5000);
      chrome.runtime.sendMessage({ type: 'QUERY_TAB_URL_FOR_AI' }, (response) => {
        clearTimeout(timeoutId);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (urlResp && urlResp.type === 'TAB_URL_FOR_AI_DATA' && urlResp.data) {
      urlInfo = t('chat.tabUrl', { url: urlResp.data });
    }
  } catch {
    // 静默失败
  }

  try {
    const reqResp = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('timeout')), 5000);
      chrome.runtime.sendMessage({ type: 'QUERY_REQUESTS_FOR_AI' }, (response) => {
        clearTimeout(timeoutId);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (reqResp && reqResp.type === 'REQUESTS_FOR_AI_DATA' && reqResp.data && reqResp.data.length > 0) {
      let requestData = JSON.stringify(reqResp.data);
      if (requestData.length > CONTEXT_MAX_CHARS) {
        const recentItems = reqResp.data.slice(-3);
        requestData = JSON.stringify(recentItems);
      }
      requestInfo = t('chat.capturedRequestsLabel', { data: requestData });
    } else {
      requestInfo = t('chat.noCapturedRequests');
    }
  } catch {
    requestInfo = t('chat.cannotGetRequests');
  }

  let context = urlInfo;
  if (requestInfo) {
    context += (context ? '\n\n' : '') + requestInfo;
  }
  if (!context) return null;

  return t('systemPrompt.contextInfo') + '\n' + context;
}

function buildSkillDirectory() {
  const registry = window.__getSkillRegistry();
  const all = registry.getAll();
  if (all.length === 0) return '';

  let dir = t('chat.registeredSkills') + '\n\n';
  all.forEach(function (s) {
    dir += '- **' + s.id + '**: ' + (s.description || '') + '\n';
  });
  dir += '\n' + t('chat.skillAutoUseHint');
  return dir;
}

function buildActiveSkillPrompt() {
  var skills;
  if (window.__lastActiveSkills && window.__lastActiveSkills.length > 0) {
    skills = window.__lastActiveSkills;
  } else {
    const registry = window.__getSkillRegistry();
    skills = registry.getActive();
  }
  if (skills.length === 0) return '';

  let prompt = t('chat.activeSkillRules') + '\n\n';
  skills.forEach(function (s) {
    prompt += (typeof s.getPrompt === 'function' ? s.getPrompt() : s.prompt) + '\n\n---\n\n';
  });
  return prompt;
}

async function buildKnowledgeContext() {
  if (typeof loadKnowledgeItems !== 'function') return null;

  try {
    const items = await loadKnowledgeItems();
    const withFiles = items.filter(p => p.fileCount > 0);

    if (withFiles.length === 0) return null;

    let summary = t('chat.syncedProjects');
    for (const p of withFiles) {
      summary += t('chat.syncedFileCount', { name: p.displayName, count: p.fileCount });
      if (p.description) summary += ' - ' + p.description;
      summary += ', ';
    }
    summary = summary.replace(/, $/, '. ');

    summary += '\n知识条目ID:\n';
    for (const p of withFiles) {
      summary += '- ' + p.displayName + ': ' + p.id + '\n';
    }

    return summary + t('chat.useTools');
  } catch {
    return null;
  }
}

async function buildMemoryHint() {
  if (typeof loadMemoryItem !== 'function' || typeof FileCacheManager === 'undefined') return null;

  try {
    const memoryItem = await loadMemoryItem();
    if (!memoryItem || !memoryItem.fileCount || memoryItem.fileCount === 0) {
      console.log('[MemoryHint] 无记忆卡片或无文件, fileCount:', memoryItem ? memoryItem.fileCount : 'null');
      return null;
    }

    const hostname = typeof getCurrentHostname === 'function' ? getCurrentHostname() : null;
    if (!hostname) return null;

    const files = await FileCacheManager.getFilesByKnowledge(memoryItem.id);
    const domainFiles = files.filter(function (f) {
      return f.path.startsWith(hostname + '/');
    });
    const generalFiles = files.filter(function (f) {
      return f.path.startsWith('general/');
    });

    var domainAndGeneralAreSame = (hostname === 'general');
    if (domainAndGeneralAreSame) {
      domainFiles.length = 0;
      for (var i = 0; i < generalFiles.length; i++) {
        domainFiles.push(generalFiles[i]);
      }
    }

    var hasDomainFiles = domainFiles.length > 0;
    var hasGeneralFiles = !domainAndGeneralAreSame && generalFiles.length > 0;

    if (!hasDomainFiles && !hasGeneralFiles) {
      console.log('[MemoryHint] 当前域和通用域均无记忆文件');
      return null;
    }

    var hintParts = [];

    if (hasDomainFiles) {
      var fileList = domainFiles.slice(0, 3).map(function(f) {
        var name = f.path.split('/').pop().replace('.md', '');
        return name;
      }).join('、');

      if (domainAndGeneralAreSame) {
        hintParts.push('通用记忆中有 ' + domainFiles.length + ' 条跨域经验：' +
          fileList + (domainFiles.length > 3 ? ' 等' : '') + '。' +
          '建议调用 search_memories({domain: \'general\'}) 查询通用记忆。');
      } else {
        hintParts.push('当前域名 ' + hostname + ' 下有 ' + domainFiles.length + ' 条历史记忆：' +
          fileList + (domainFiles.length > 3 ? ' 等' : '') + '。');

        var mapFile = null;
        for (var mi = 0; mi < domainFiles.length; mi++) {
          var fname = domainFiles[mi].path.split('/').pop().replace('.md', '');
          if (fname === '功能地图' || fname === 'function-map' || fname === 'Function Map') {
            mapFile = domainFiles[mi];
            break;
          }
        }
        if (mapFile) {
          var mapPrompt = typeof t === 'function' ? t('chat.memoryMapGuidance') : '';
          if (!mapPrompt) {
            mapPrompt = '当用户询问功能位置时，优先调用 search_memories 查找功能地图文件（' + mapFile.path + '），读取该文件获取功能位置信息后直接回答，无需重新探索页面。';
          }
          hintParts.push('当前域名下存在功能地图文件（' + mapFile.path + '），包含该系统的功能导航信息。' + mapPrompt);
        }
      }
    }

    if (hasGeneralFiles) {
      var generalFileList = generalFiles.slice(0, 3).map(function(f) {
        var name = f.path.split('/').pop().replace('.md', '');
        return name;
      }).join('、');

      hintParts.push('通用记忆中有 ' + generalFiles.length + ' 条跨域经验：' +
        generalFileList + (generalFiles.length > 3 ? ' 等' : '') + '。');
    }

    var shouldPrioritizeDomain = hasDomainFiles && !domainAndGeneralAreSame;
    var hint = hintParts.join('\n\n');

    if (shouldPrioritizeDomain) {
      if (hasGeneralFiles) {
        hint += '\n\n' + '强烈建议先调用 search_memories 查当前域名记忆，如果涉及通用方法/模式/经验，也可以调用 search_memories({domain: \'general\'}) 查询通用记忆。再对相关的文件调用 get_memory_file 读取完整内容，获取上次的解决方案和经验。';
      } else {
        hint += '\n\n' + '强烈建议先调用 search_memories，再对相关的文件调用 get_memory_file 读取完整内容，获取上次的解决方案和经验。';
      }
    }

    console.log('[MemoryHint] 注入提示:', hint.substring(0, 120));
    return hint;
  } catch {
    return null;
  }
}

function buildMergedTools() {
  const seen = new Set();
  const merged = [];

  TOOLS.forEach(function (t) {
    if (t.function && !seen.has(t.function.name)) {
      seen.add(t.function.name);
      merged.push({ type: 'function', function: t.function });
    }
  });

  return merged;
}

async function streamLLM(messages, signal, onToken, onToolCalls, onReasoning) {
  const config = await loadModelConfig();
  if (!config) {
    throw new Error(t('chat.notConfigured'));
  }

  const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/v1/chat/completions`;

  const body = JSON.stringify({
    model: config.modelName,
    messages: messages,
    tools: buildMergedTools(),
    stream: true,
  });

  const msgSummary = messages.map(m => ({
    role: m.role,
    contentLen: (m.content || '').length,
    hasReasoning: !!m.reasoning_content,
    reasoningLen: (m.reasoning_content || '').length,
  }));
  const reasoningInBody = body.includes('reasoning_content');
  console.log('streamLLM: sending', messages.length, 'messages:', JSON.stringify(msgSummary));
  console.log('streamLLM: body contains "reasoning_content":', reasoningInBody, 'body length:', body.length);
  window._lastBodyHadReasoning = reasoningInBody;
  window._lastMsgCount = messages.length;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  let response;
  try {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body,
      signal,
    }, REQUEST_TIMEOUT_MS);
  } catch (err) {
    console.error('streamLLM fetch error:', err);
    throw err;
  }

  const contentType = response.headers.get('content-type') || '';
  console.log('streamLLM response status:', response.status, 'content-type:', contentType);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  if (contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson')) {
    if (!response.body) {
      throw new Error(t('chat.noStreamBody'));
    }
    return await parseSSEStream(response, signal, onToken, onToolCalls, onReasoning);
  }

  console.log('streamLLM: falling back to non-streaming');
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content || '';
  const reasoningContent = message?.reasoning_content || '';
  const toolCalls = message?.tool_calls || [];

  if (toolCalls.length > 0) {
    onToolCalls(toolCalls);
  } else if (content) {
    onToken(content);
  }

  return { reasoningContent };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const externalSignal = options.signal;

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      if (externalSignal && externalSignal.aborted) {
        throw err;
      }
      throw new Error('timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseSSEStream(response, signal, onToken, onToolCalls, onReasoning) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const accumulatedToolCalls = [];
  let reasoningContent = '';

  try {
    while (true) {
      if (signal.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          console.log('parseSSEStream: [DONE] reasoningContent length =', reasoningContent.length);
          if (accumulatedToolCalls.length > 0) {
            onToolCalls(accumulatedToolCalls);
          }
          return { reasoningContent };
        }

        try {
          const chunk = JSON.parse(dataStr);
          const delta = chunk.choices?.[0]?.delta;

          if (!delta) continue;

          if (delta.reasoning_content) {
            reasoningContent += delta.reasoning_content;
            if (onReasoning) onReasoning(delta.reasoning_content);
          }

          if (delta.content) {
            onToken(delta.content);
          } else if (delta.reasoning_content) {
            // reasoning-only chunk, already accumulated above
          } else {
            console.log('parseSSEStream: unknown delta keys:', Object.keys(delta));
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index || 0;
              while (accumulatedToolCalls.length <= idx) {
                accumulatedToolCalls.push({
                  id: '',
                  type: 'function',
                  function: { name: '', arguments: '' },
                });
              }
              if (tc.id) accumulatedToolCalls[idx].id = tc.id;
              if (tc.function?.name) accumulatedToolCalls[idx].function.name += tc.function.name;
              if (tc.function?.arguments) accumulatedToolCalls[idx].function.arguments += tc.function.arguments;
            }
          }
        } catch {
          // skip invalid JSON lines
        }
      }
    }
    return { reasoningContent };
  } finally {
    reader.cancel();
  }
}

var _isComposing = false;

chatInputEl.addEventListener('compositionstart', () => { _isComposing = true; });
chatInputEl.addEventListener('compositionend', () => { _isComposing = false; });

sendBtn.addEventListener('click', sendChatMessage);

var attachBtn = document.getElementById('attachBtn');
var chatFileInput = document.getElementById('chatFileInput');
if (attachBtn && chatFileInput) {
  attachBtn.addEventListener('click', function () {
    chatFileInput.click();
  });
  chatFileInput.addEventListener('change', handleFileSelect);
}

chatInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !_isComposing) {
    e.preventDefault();
    sendChatMessage();
  }
});

stopBtn.addEventListener('click', () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  if (window.currentSessionId && typeof SessionManager !== 'undefined') {
    SessionManager._clearTitleTimer(window.currentSessionId);
  }
  setSending(false);
});

chatMessagesEl.addEventListener('click', (e) => {
  const executeBtn = e.target.closest('.task-btn-execute');
  if (executeBtn) {
    const card = executeBtn.closest('.task-card');
    if (card) {
      const taskId = card.getAttribute('data-task-id');
      if (taskId) handleTaskExecute(taskId);
    }
    return;
  }

  const cancelBtn = e.target.closest('.task-btn-cancel');
  if (cancelBtn) {
    const card = cancelBtn.closest('.task-card');
    if (card) {
      const taskId = card.getAttribute('data-task-id');
      if (taskId) {
        updateTaskCard(taskId, { status: 'cancelled' });
      }
    }
  }
});
