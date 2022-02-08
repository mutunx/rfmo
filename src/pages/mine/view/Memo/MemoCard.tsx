import React from 'react';
import { MdOutlineMoreHoriz } from 'react-icons/md';
import { Popover } from 'antd';
import RichEditor from '@/pages/mine/components/RichEditor';
import produce from 'immer';
import dayjs from 'dayjs';

import MineStoreContainer from '@/store/MineStoreContainer';
import { db } from '@/store/db';
import Dialog from '@/components/Dialog';
import { autoSync } from '@/utils/syncData';
import ShareCard from './ShareCard';

import Styles from './Memo.module.less';

export interface MemoCardProps {
  item: Record<string, any>;
  itemIndex: number;
}

const MemoCardMore = React.forwardRef(
  (
    {
      onSelect,
      ...rest
    }: {
      onSelect: (key: string | undefined) => void;
      rest?: {
        children?: React.ReactNode;
      };
    },
    ref: React.Ref<HTMLDivElement>,
  ) => (
    <div className={Styles.popover} ref={ref} {...rest}>
      <button type="button" onClick={() => onSelect('share')}>
        分享
      </button>
      <button type="button" onClick={() => onSelect('edit')}>
        编辑
      </button>
      <button type="button" onClick={() => onSelect('delete')}>
        删除
      </button>
    </div>
  ),
);

const MemoCard: React.FC<MemoCardProps> = ({ item, itemIndex }) => {
  const { memoList, setMemoList, setSyncLoading } = MineStoreContainer.usePicker([
    'memoList',
    'setMemoList',
    'setSyncLoading',
  ]);

  const [isEdit, setIsEdit] = React.useState(false);
  const editorRef = React.useRef<Record<string, any>>(null);

  const [popoverVisible, setPopoverVisible] = React.useState(false);

  const handleDelItem = async (params: Record<string, any>) => {
    const { node_id } = params;
    await db.memo.delete(node_id);
    const filterMemoList = memoList.filter((memoItem: Record<string, any>) => {
      return memoItem.node_id !== node_id;
    });
    setMemoList(filterMemoList);
    autoSync(setSyncLoading);
  };

  const handleUpdateItem = async () => {
    const { node_id } = item;
    const value = editorRef.current!.value;

    await db.memo.update(node_id, {
      body: value,
      updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });

    const res = await db.memo.get(node_id);
    const newMemoList = produce(memoList, (draftState) => {
      draftState[itemIndex] = res!;
    });

    setMemoList(newMemoList);
    setIsEdit(false);
    autoSync(setSyncLoading);
  };

  const handleSelectMenu = (key: string | undefined) => {
    if (key === 'edit') setIsEdit(true);
    if (key === 'delete') handleDelItem(item);
    if (key === 'share') {
      setPopoverVisible(false);

      Dialog.render({
        title: '分享 rFmo 图片',
        content: <ShareCard item={item} />,
      });
    }
  };

  const handlePopoverVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };

  return (
    <div className={Styles.memo}>
      <div className={Styles.card}>
        {isEdit ? (
          <RichEditor
            ref={editorRef}
            initDoc={item.body}
            disableSubmit={true}
            extraBtn={
              <>
                <button
                  type="button"
                  style={{ marginRight: '6px' }}
                  onClick={() => {
                    setIsEdit(false);
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateItem();
                  }}
                >
                  更新
                </button>
              </>
            }
          />
        ) : (
          <>
            <div className={Styles.header}>
              <div className={Styles.time}>{item.updated_at}</div>
              <div style={{ cursor: 'pointer' }}>
                <Popover
                  placement="bottomRight"
                  content={<MemoCardMore onSelect={handleSelectMenu} />}
                  trigger="click"
                  overlayInnerStyle={{ borderRadius: '8px' }}
                  overlayClassName={Styles['ant-popover']}
                  visible={popoverVisible}
                  onVisibleChange={handlePopoverVisibleChange}
                >
                  <div>
                    <MdOutlineMoreHoriz />
                  </div>
                </Popover>
              </div>
            </div>
            <div className={Styles.content}>
              <div dangerouslySetInnerHTML={{ __html: item.body }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemoCard;
