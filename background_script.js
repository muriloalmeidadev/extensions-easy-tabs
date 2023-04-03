//#region ## GLOBALS ##

const ENUMS = {
    TARGET: {
        CLIPBOARD: 0,
        GROUP: 1
    }
}

const APP_SETTINGS = {
    MENUS: [
        {
            title: 'Copy tabs',
            context: 'tab',
            children: [
                { title: 'Copy all', callback: () => sendTabsTo(0, -1, ENUMS.TARGET.CLIPBOARD) },
                { title: 'Copy tabs to left', callback: (tabId) => sendTabsTo(-1, tabId, ENUMS.TARGET.CLIPBOARD) },
                { title: 'Copy tabs to right', callback: (tabId) => sendTabsTo(1, tabId, ENUMS.TARGET.CLIPBOARD) }
            ]
        },
        {
            title: 'Group in one tab',
            context: 'tab',
            children: [
                { title: 'Group all', callback: () => sendTabsTo(0, -1, ENUMS.TARGET.GROUP) },
                { title: 'Group tabs to left', callback: (tabId) => sendTabsTo(-1, tabId, ENUMS.TARGET.GROUP) },
                { title: 'Group tabs to right', callback: (tabId) => sendTabsTo(1, tabId, ENUMS.TARGET.GROUP) },
            ]
        },
        {
            title: 'Open clipboard in tabs',
            context: 'tab',
            callback: () => openTabs()
        }
    ]
}

//#endregion

//#region ## FUNCTIONS ##

function randomId() {
    return [1, 2, 3].map(() => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)).join('')
}

function sendTabsTo(direction, tabId, target) {
    browser.tabs.query({ currentWindow: true }).then(tabs => {
        const currentIndex = tabs.map(x => x.id).indexOf(tabId)

        tabs = direction < 0
            ? tabs.slice(0, currentIndex)
            : direction > 0
                ? tabs.slice(currentIndex + 1)
                : tabs

        const serialized = tabs.map(x => x.url).join('\n')

        target === ENUMS.TARGET.CLIPBOARD
            ? navigator.clipboard.writeText(serialized)
            : browser.tabs.create({ url: URL.createObjectURL(new Blob([serialized])) })

        browser.tabs.remove(tabs.map(x => x.id))
    })
}

function openTabs() {
    navigator.clipboard.readText().then(clipboard => {
        clipboard.split('\n').forEach(url => browser.tabs.create({ url }))
    })
}

function buildMenu(menu, parentId, parentContext) {
    const id = `menu-id-${this.randomId()}`
    browser.menus.create({
        id,
        parentId,
        type: menu.type,
        contexts: (menu.context ? menu.context : parentContext).split(','),
        title: menu.title
    })
    browser.menus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === id) {
            menu.callback(tab.id, info.linkUrl)
        }
    })
    menu.children?.forEach(childMenu => this.buildMenu(childMenu, id, menu.context))
}

//#endregion

// Extension Startup

APP_SETTINGS.MENUS.forEach(menu => this.buildMenu(menu))