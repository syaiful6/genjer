import m from 'mithril/hyperscript'
import type { ChildArrayOrPrimitive, Component, Vnode } from 'mithril'

export interface PannelAttrs<A> {
  tab: A;
}

export interface TabAttrs<A> {
  initial: A,
  render: ({ Tab, TabPanel }: { Tab: Component<PannelAttrs<A>>, TabPanel: Component<PannelAttrs<A>> }) => ChildArrayOrPrimitive
}

export default <A>({ attrs }: Vnode<TabAttrs<A>>): Component<TabAttrs<A>> => {
  let active = attrs.initial

  const Tab = {
    view: ({ children, attrs: { tab } }: Vnode<{ tab: A }>) =>
      m('.p2', {
        class: tab === active
          ? 'border border-blue text-blue rounded'
          : 'hover:text-blue cursor-pointer',
        onclick: () => {
          active = tab
        }
      }, children)
  }

  const TabPanel = {
    view: ({ children, attrs: { tab } }: Vnode<{ tab: A }>) =>
      tab === active && children
  }

  return {
    view: ({ attrs: { render } }: Vnode<TabAttrs<A>>) =>
      render({ Tab, TabPanel })
  }
}
