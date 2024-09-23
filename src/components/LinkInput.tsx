import { Button, Flex, Modal } from '@webkom/lego-bricks';
import React, { useRef, useState, useEffect } from 'react';
import { Node, NodeEntry, Element } from 'slate';
import isUrl, { prependHttps } from '../utils/isUrl';

interface LinkInputProps {
  active: boolean;
  activeLink?: NodeEntry;
  toggleLinkInput: () => void;
  updateLink: ({ url, text }: { url: string; text?: string }) => void;
}

import './LinkInput.css';

const LinkInput = (props: LinkInputProps): JSX.Element => {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Why is this in a setTimeout?
    // - Because why not? (I couldn't make it work without)
    setTimeout(() => input.current?.focus(), 10);
  }, []);

  const [showModal, setShowModal] = useState(true);
  const [url, setUrl] = useState<string>(
    props.activeLink &&
      Element.isElement(props.activeLink[0]) &&
      props.activeLink[0].type === 'link'
      ? props.activeLink[0].url
      : '',
  );
  const [linkText, setLinkText] = useState<string>(
    props.activeLink ? Node.string(props.activeLink[0]) : '',
  );

  const submit = (): void => {
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

  const onModalOpenChange = (isOpen: boolean): void => {
    if (!isOpen) {
      props.toggleLinkInput();
    }
    setShowModal(isOpen);
  };

  return (
    <Modal isOpen={showModal} onOpenChange={onModalOpenChange}>
      <Flex column alignItems="center" justifyContent="center" gap={20}>
        <label className="_legoEditor_linkInput_label">
          <span>Link</span>
          <input
            className="_legoEditor_linkInput_input"
            type="link"
            placeholder="https://example.com"
            ref={input}
            onChange={onChange}
            onKeyDown={onKeyPress}
            value={url}
          />
        </label>
        <label className="_legoEditor_linkInput_label">
          <span>Text to display</span>
          <input
            className="_legoEditor_linkInput_input"
            type="text"
            placeholder="Example site"
            onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={onKeyPress}
            value={linkText}
          />
        </label>
        <Flex className="_legoEditor_linkInput_submitContainer" justifyContent="center">
          <Button secondary disabled={!isUrl(url)} onPress={submit}>
            Bruk
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default LinkInput;
