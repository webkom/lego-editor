import * as React from 'react';
import Modal from 'react-modal';
import cx from 'classnames';

type Props = {
  onCancel: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  children?: React.ReactChild[] | React.ReactChild;
};

const LegoModal: React.FC<Props> = ({
  children,
  onCancel,
  onSubmit,
  disabled,
}) => (
  <Modal ariaHideApp={false} isOpen={true} className="_legoEditor_modal_modal">
    <div className="_legoEditor_modal_wrapper">
      <div className="_legoEditor_modal_root">
        {children}
        <div className="_legoEditor_modal_buttonContainer">
          <button
            className={cx(
              '_legoEditor_modal_applyButton',
              '_legoEditor_modal_button'
            )}
            onClick={onSubmit}
            type="button"
            disabled={disabled}
          >
            Apply
          </button>

          <button
            className={cx(
              '_legoEditor_modal_cancelButton',
              '_legoEditor_modal_button'
            )}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Modal>
);

export default LegoModal;
