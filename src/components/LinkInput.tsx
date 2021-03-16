import React, { useRef, useState, useEffect } from 'react';
import { Node, NodeEntry } from 'slate';
import isUrl, { prependHttps } from '../utils/isUrl';
import Modal from './Modal';

interface LinkInputProps {
  active: boolean;
  activeLink?: NodeEntry;
  toggleLinkInput: () => void;
  updateLink: ({ url, text }: { url: string; text?: string }) => void;
}

const LinkInput = (props: LinkInputProps): JSX.Element => {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Why is this in a setTimeout?
    // - Because why not? (I couldn't make it work without)
    setTimeout(() => input.current?.focus(), 10);
  }, []);

  const [url, setUrl] = useState<string>(
    props.activeLink ? props.activeLink[0].url : ''
  );
  const [linkText, setLinkText] = useState<string>(
    props.activeLink ? Node.string(props.activeLink[0]) : ''
  );

  const submit = (
    e?: React.FocusEvent | React.KeyboardEvent | React.MouseEvent
  ): void => {
    e?.preventDefault();
    props.toggleLinkInput();
    if (url == '') {
      return;
    }
    isUrl(url) && props.updateLink({ url, text: linkText });
  };

  const onKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key == 'Enter') {
      submit();
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.value.length >= url.length) {
      setUrl(prependHttps(e.target.value));
    } else {
      setUrl(e.target.value);
    }
  };

  return (
    <Modal
      onCancel={props.toggleLinkInput}
      onSubmit={submit}
      disabled={!isUrl(url)}
    >
      <div className="_legoEditor_linkInput_wrapper">
        <div className="_legoEditor_linkInput_inputWrapper">
          <label className="_legoEditor_linkInput_label">
            <span>Link:</span>
            <input
              className="_legoEditor_linkInput_"
              type="link"
              placeholder="https://example.com"
              ref={input}
              onChange={onChange}
              onKeyDown={onKeyPress}
              value={url}
            />
          </label>
        </div>
        <div className="_legoEditor_linkInput_inputWrapper">
          <label className="_legoEditor_linkInput_label">
            <span>Text to display:</span>
            <input
              type="text"
              placeholder="Example site"
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={onKeyPress}
              value={linkText}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default LinkInput;
