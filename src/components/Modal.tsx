import React, { type ReactNode, useState } from 'react';
import Modal from 'react-modal';
import cx from 'classnames';

type Props = {
  onCancel: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  children?: ReactNode[] | ReactNode;
};

const LegoModal: React.FC<Props> = ({
  children,
  onCancel,
  onSubmit,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const closeModal = () => {
    onCancel();
    setIsOpen(false);
  };

  return (
    <Modal
      style={{ overlay: { zIndex: 10 } }}
      onRequestClose={closeModal}
      ariaHideApp={false}
      isOpen={isOpen}
    >
      <div className="_legoEditor_modal_wrapper">
        <div className="_legoEditor_modal_root">
          <button
            onClick={closeModal}
            className={cx(
              '_legoEditor_modal_closeButton',
              '_legoEditor_modal_button'
            )}
          >
            <i className="fa fa-times" />
          </button>

          {children}
          <div className="_legoEditor_modal_buttonContainer">
            <button
              className={cx(
                '_legoEditor_modal_cancelButton',
                '_legoEditor_modal_button'
              )}
              onClick={onCancel}
              type="button"
            >
              Avbryt
            </button>

            <button
              className={cx(
                '_legoEditor_modal_applyButton',
                '_legoEditor_modal_button'
              )}
              onClick={onSubmit}
              type="button"
              disabled={disabled}
            >
              Bruk
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LegoModal;
