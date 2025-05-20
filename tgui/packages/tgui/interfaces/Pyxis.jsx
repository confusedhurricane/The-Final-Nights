import { useBackend, useLocalState } from '../backend';
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  LabeledList,
  NoticeBox,
  Table,
  Tabs,
} from 'tgui-core/components';
import { Window } from '../layouts';
import { useEffect, useState } from 'react';
import { resolveAsset } from '../assets';

// Windows XP colors and styling constants
const WINXP_COLORS = {
  blue: '#2573bc',
  lightBlue: '#56a0ea',
  darkBlue: '#0a246a',
  green: '#4f9e4f',
  lightGreen: '#70c170',
  red: '#b22222',
  grey: '#d4d0c8',
  darkGrey: '#808080',
  white: '#f8f6e9',
  black: '#000000',
  windowBorder: '#2573bc',
  controlBg: '#ece9d8',
  controlBorder: '#ada89e',
  titlebarBlue: 'linear-gradient(to right, #0a246a, #a6caf0)',
  disabledBg: '#f0f0f0',
  paperWhite: '#f8f6e9',
  medBackground: '#f5f3e4',
};

// Common style objects
const COMMON_STYLES = {
  // Border styles
  standardBorder: {
    border: `1px solid ${WINXP_COLORS.controlBorder}`,
    borderRadius: '3px',
  },

  // Content box styles
  contentBoxStyle: {
    backgroundColor: WINXP_COLORS.paperWhite,
    borderRadius: '2px',
  },

  // Window styles
  windowStyle: {
    border: `1px solid ${WINXP_COLORS.windowBorder}`,
    borderRadius: '3px',
    backgroundColor: WINXP_COLORS.controlBg,
    marginBottom: '10px',
    boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
  },

  // Title bar styles
  titleBarStyle: {
    background: WINXP_COLORS.titlebarBlue,
    color: WINXP_COLORS.white,
    padding: '2px 8px',
    height: '22px',
    fontWeight: 'bold',
    userSelect: 'none',
  },

  // Scrollable content area
  scrollableContent: {
    overflowY: 'auto',
    padding: '6px',
  },

  // Button styles
  buttonStyle: (selected, disabled) => ({
    backgroundColor: selected
      ? WINXP_COLORS.lightBlue
      : disabled
        ? WINXP_COLORS.disabledBg
        : WINXP_COLORS.controlBg,
    border: `1px solid ${WINXP_COLORS.controlBorder}`,
    borderRadius: '3px',
    color: selected
      ? WINXP_COLORS.black
      : disabled
        ? WINXP_COLORS.darkGrey
        : WINXP_COLORS.black,
    padding: '2px 6px',
    margin: '1px',
    fontWeight: selected ? 'bold' : 'normal',
  }),

  // Action button style (i.e. dispense/confirm)
  actionButtonStyle: {
    backgroundColor: WINXP_COLORS.green,
    color: WINXP_COLORS.black,
    border: `1px solid ${WINXP_COLORS.controlBorder}`,
    borderRadius: '3px',
    padding: '6px 12px',
    fontWeight: 'bold',
  },

  // Input style
  inputStyle: {
    color: WINXP_COLORS.black,
    backgroundColor: WINXP_COLORS.medBackground,
    border: `1px solid ${WINXP_COLORS.controlBorder}`,
  },

  // Notice box style
  noticeBoxStyle: {
    background: WINXP_COLORS.controlBg,
    border: `1px solid ${WINXP_COLORS.controlBorder}`,
    borderLeft: `4px solid ${WINXP_COLORS.blue}`,
    padding: '8px',
    marginBottom: '8px',
    borderRadius: '0 3px 3px 0',
  },
};

// Common icon definitions
const XP_ICONS = {
  medical: 'heart',
  medication: 'pills',
  controlled: 'lock',
  staff: 'user-md',
  cleaning: 'spray-can',
  office: 'pencil-alt',
  alert: 'exclamation-triangle',
  logout: 'sign-out-alt',
  cart: 'shopping-cart',
  history: 'clipboard-list',
  settings: 'cog',
  dispense: 'hand-holding-medical',
  restock: 'boxes',
  emergency: 'ambulance',
  protect: 'shield-alt',
};

// hook for handling messages consistently
const useMessageHandler = (messages) => {
  const [showMessages, setShowMessages] = useState(
    messages && messages.length > 0,
  );

  useEffect(() => {
    if (messages && messages.length > 0) {
      setShowMessages(true);
    }
  }, [messages]);

  return [showMessages, setShowMessages];
};

//Helper function to get color based on stock level
const getStockColor = (stock) => {
  if (stock <= 0) return '#c41f1f';
  if (stock < 3) return '#e67300';
  if (stock < 5) return '#b38600';
  return '#008a1b';
};

// Helper function to get appropriate icon for category
const getCategoryIcon = (category) => {
  if (category.includes('Medical')) return XP_ICONS.medical;
  if (category.includes('Medication')) return XP_ICONS.medication;
  if (category.includes('Controlled')) return XP_ICONS.controlled;
  if (category.includes('Staff')) return XP_ICONS.staff;
  if (category.includes('Cleaning')) return XP_ICONS.cleaning;
  if (category.includes('Office')) return XP_ICONS.office;
  return 'box';
};

// Styled component for consistent input styling
const StyledInput = (props) => {
  const { value, placeholder, onChange, ...rest } = props;

  return (
    <Input
      placeholder={placeholder}
      value={value}
      fluid
      style={{
        ...COMMON_STYLES.inputStyle,
      }}
      onChange={onChange}
      {...rest}
    />
  );
};

// Content box with consistent styling for panels
const ContentBox = (props) => {
  const { children, ...rest } = props;

  return (
    <Box
      style={{
        ...COMMON_STYLES.contentBoxStyle,
        ...props.style,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

// WinXP style button component
const XPButton = (props) => {
  const {
    icon,
    content,
    color = WINXP_COLORS.blue,
    selected,
    disabled,
    tooltip,
    onClick,
    ...rest
  } = props;

  const handleClick = (e) => {
    if (onClick && !disabled) {
      onClick(e);
    }
  };

  return (
    <Button
      className="xp-button"
      icon={icon}
      content={content}
      color={selected ? WINXP_COLORS.darkBlue : color}
      disabled={disabled}
      tooltip={tooltip}
      onClick={handleClick}
      {...rest}
      style={{
        ...COMMON_STYLES.buttonStyle(selected, disabled),
        ...props.style,
      }}
    />
  );
};

// Title bar
const XPTitleBar = (props) => {
  const { title, icon, onClose } = props;

  return (
    <Flex
      className="xp-titlebar"
      align="center"
      style={COMMON_STYLES.titleBarStyle}
    >
      <Flex.Item>
        {icon && <Icon name={icon} mr={1} />}
        {title}
      </Flex.Item>
      <Flex.Item grow={1} />
      <Flex.Item>
        {onClose && (
          <Button color="transparent" icon="window-close" onClick={onClose} />
        )}
      </Flex.Item>
    </Flex>
  );
};

// Main application container
const XPWindow = ({ title, icon, children, ...rest }) => {
  return (
    <Box
      className="xp-window"
      style={{
        ...COMMON_STYLES.windowStyle,
        ...rest.style,
      }}
      {...rest}
    >
      <XPTitleBar title={title} icon={icon} />
      <Box p={1}>{children}</Box>
    </Box>
  );
};

// Windows XP styleNoticeBox
const XPNoticeBox = ({ icon, children, ...props }) => {
  return (
    <Box
      style={{
        ...COMMON_STYLES.noticeBoxStyle,
        ...props.style,
      }}
      {...props}
    >
      <Flex align="center">
        {icon && (
          <Flex.Item mr={1}>
            <Icon name={icon} />
          </Flex.Item>
        )}
        <Flex.Item grow={1}>{children}</Flex.Item>
      </Flex>
    </Box>
  );
};

// Windows XP style Modal
const XPModal = ({ title, icon, onClose, width = 300, children }) => {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      style={{
        transform: 'translate(-50%, -50%)',
        'z-index': 10,
        width: `${width}px`,
      }}
    >
      <XPWindow title={title} icon={icon}>
        <Box p={1} color={WINXP_COLORS.black}>
          {children}
          {onClose && (
            <Box mt={2} textAlign="right">
              <XPButton icon="times" content="Close" onClick={onClose} />
            </Box>
          )}
        </Box>
      </XPWindow>
    </Box>
  );
};

// Item icons
const ItemIcon = ({ icon }) => {
  if (!icon) {
    return null;
  }

  return (
    <Box
      className="item-icon"
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '2px',
        backgroundColor: WINXP_COLORS.medBackground,
        border: `1px solid ${WINXP_COLORS.controlBorder}`,
        borderRadius: '3px',
        overflow: 'hidden',
      }}
    >
      {typeof icon === 'string' && icon.length > 0 ? (
        <Box
          as="img"
          src={`data:image/png;base64,${icon}`}
          style={{
            '-ms-interpolation-mode': 'nearest-neighbor',
            'image-rendering': 'pixelated',
            'object-fit': 'contain',
            width: '100%',
            height: '100%',
          }}
          onError={(e) => {
            // On error, replace with an icon
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'block';
          }}
        />
      ) : (
        <Icon name="prescription-bottle-alt" size={1.5} />
      )}
    </Box>
  );
};

// Message notification modal
const MessageModal = ({ messages, onClose }) => {
  const { act } = useBackend();

  if (!messages || messages.length === 0) {
    return null;
  }

  useEffect(() => {}, []);

  const handleClose = () => {
    try {
      act('acknowledge_messages');
    } catch (error) {
      console.error('Failed to acknowledge messages:', error);
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <XPModal
      title="System Messages"
      icon="comment"
      onClose={handleClose}
      width={400}
    >
      {messages.map((msg, i) => (
        <Box key={i} color={WINXP_COLORS.black} mb={1}>
          {msg}
        </Box>
      ))}
    </XPModal>
  );
};

// Login screen component
const PyxisLogin = (props) => {
  const { act } = useBackend();
  const { messages } = props;
  const [showMessages, setShowMessages] = useMessageHandler(messages);

  const handleLogin = () => {
    act('scan_id');
  };

  return (
    <Box
      style={{
        height: '100%',
        background: WINXP_COLORS.controlBg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '20px',
      }}
    >
      {/* Header Bar */}
      <Box mb={2}>
        <XPWindow title="Pyxis MedStation" icon="laptop-medical">
          <ContentBox
            p={1}
            style={{
              background: 'linear-gradient(to right, #356aa0, #9dc9ed)',
              color: WINXP_COLORS.white,
              textAlign: 'center',
              padding: '10px',
            }}
          >
            <Box fontSize="18px" fontWeight="bold" mb={1}>
              St. John's Community Clinic
            </Box>
            <Box fontSize="12px">
              Automated Medication &amp; Supply Dispensing
            </Box>
          </ContentBox>
        </XPWindow>
      </Box>

      {/* Main Login Panel */}
      <Box flex="1">
        <XPWindow title="User Authentication" icon="user-lock">
          <Box p={2}>
            <Flex direction="column" align="center">
              <Flex.Item mb={4}>
                <Box style={{ textAlign: 'center' }}>
                  <Icon
                    name="first-aid"
                    size={6}
                    style={{
                      color: '#cc3333',
                      background: WINXP_COLORS.paperWhite,
                      border: '1px solid #e6e6e6',
                      borderRadius: '50%',
                      padding: '15px',
                      margin: '0 auto',
                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </Box>
              </Flex.Item>

              <Flex.Item mb={3} width="100%">
                <XPNoticeBox icon="info-circle">
                  <Box color={WINXP_COLORS.black}>
                    Please swipe or scan your ID card to access the system. This
                    terminal is for authorized clinical staff only.
                  </Box>
                </XPNoticeBox>
              </Flex.Item>

              <Flex.Item mb={4} width="100%">
                <ContentBox
                  style={{
                    border: `1px solid ${WINXP_COLORS.controlBorder}`,
                    padding: '20px',
                    backgroundColor: WINXP_COLORS.medBackground,
                    textAlign: 'center',
                  }}
                >
                  <Flex align="center" justify="center">
                    <XPButton
                      icon="id-card"
                      content="Scan ID Card"
                      style={{
                        backgroundColor: WINXP_COLORS.blue,
                        color: WINXP_COLORS.black,
                        padding: '10px 20px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                      onClick={handleLogin}
                    />
                  </Flex>
                </ContentBox>
              </Flex.Item>

              <Flex.Item width="100%">
                <Box
                  textAlign="center"
                  color={WINXP_COLORS.darkGrey}
                  fontSize="12px"
                  p={1}
                  style={{
                    borderTop: `1px solid ${WINXP_COLORS.controlBorder}`,
                    marginTop: '10px',
                    paddingTop: '10px',
                  }}
                >
                  System Version: Rev. 9:6 • © St. John's Community Clinic
                </Box>
              </Flex.Item>
            </Flex>
          </Box>
        </XPWindow>
      </Box>

      {/* Footer notice */}
      <Box mt={2}>
        <XPNoticeBox icon="shield-alt">
          <Box color={WINXP_COLORS.black} textAlign="center">
            This system is for authorized clinical use only. All transactions
            are logged.
          </Box>
        </XPNoticeBox>
      </Box>

      {/* Show messages in modal */}
      {showMessages && messages && messages.length > 0 && (
        <MessageModal
          messages={messages}
          onClose={() => setShowMessages(false)}
        />
      )}
    </Box>
  );
};

// Shopping cart
const ShoppingCart = ({ cart, act }) => {
  const sortedCart = cart
    ? [...cart].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const handleRemoveItem = (id) => {
    act('remove_from_cart', { id });
  };

  const handleClearCart = () => {
    act('clear_cart');
  };

  return (
    <XPWindow title="Shopping Cart" icon={XP_ICONS.cart}>
      <Flex direction="column" height="150px">
        <Flex.Item grow={1} style={{ overflowY: 'auto' }}>
          <Table>
            <Table.Row header>
              <Table.Cell>Item</Table.Cell>
              <Table.Cell collapsing>Amount</Table.Cell>
              <Table.Cell collapsing>Actions</Table.Cell>
            </Table.Row>
            {(!sortedCart || sortedCart.length === 0) && (
              <Table.Row>
                <Table.Cell colSpan="3" textAlign="center">
                  <Box color={WINXP_COLORS.black}>Cart is empty</Box>
                </Table.Cell>
              </Table.Row>
            )}
            {sortedCart &&
              sortedCart.map((item) => (
                <Table.Row key={item.id} className="candystripe">
                  <Table.Cell>
                    <Flex align="center">
                      {item.icon && <ItemIcon icon={item.icon} />}
                      <Flex.Item>
                        <Box color={WINXP_COLORS.black}>{item.name}</Box>
                      </Flex.Item>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Box color={WINXP_COLORS.black}>{item.amount}</Box>
                  </Table.Cell>
                  <Table.Cell>
                    <XPButton
                      icon="minus"
                      onClick={() => handleRemoveItem(item.id)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table>
        </Flex.Item>
        {sortedCart && sortedCart.length > 0 && (
          <Flex.Item shrink={0} mt={1} textAlign="right">
            <XPButton
              icon="trash"
              content="Clear Cart"
              color="bad"
              onClick={handleClearCart}
            />
          </Flex.Item>
        )}
      </Flex>
    </XPWindow>
  );
};

// Main interface component
export const Pyxis = (props) => {
  const { act, data } = useBackend();
  const {
    logged_in,
    user_name,
    user_job,
    user_access,
    messages = [],
    emergency_mode,
    reminder,
  } = data;

  // If not logged in, show login screen
  if (!logged_in) {
    return (
      <Window width={471} height={675} title="Pyxis MedStation" theme="winxp">
        <Window.Content
          scrollable={false}
          style={{ background: WINXP_COLORS.controlBg }}
        >
          <PyxisLogin messages={messages} />
        </Window.Content>
      </Window>
    );
  }

  const [activeTab, setActiveTab] = useLocalState('tab', 'requisition');
  const [messageModalOpen, setMessageModalOpen] = useMessageHandler(messages);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    act('logout');
  };

  return (
    <Window width={1020} height={855} title="Pyxis MedStation" theme="winxp">
      <Window.Content
        style={{
          'background-color': WINXP_COLORS.controlBg,
          color: WINXP_COLORS.black,
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <Flex direction="column" height="100%">
          {/* Header Bar with Navigation */}
          <Flex.Item shrink={0}>
            <XPWindow
              title={`Pyxis MedStation - ${user_name} (${user_job})`}
              icon="laptop-medical"
            >
              <Flex align="center" wrap="wrap">
                <Flex.Item grow={1}>
                  <Flex align="center">
                    <Flex.Item>
                      <XPButton
                        icon={XP_ICONS.medical}
                        content="Requisition"
                        selected={activeTab === 'requisition'}
                        onClick={() => handleTabChange('requisition')}
                      />
                    </Flex.Item>
                    <Flex.Item ml={1}>
                      <XPButton
                        icon={XP_ICONS.history}
                        content="Logs"
                        selected={activeTab === 'logs'}
                        onClick={() => handleTabChange('logs')}
                      />
                    </Flex.Item>
                    {user_access >= 4 && (
                      <Flex.Item ml={1}>
                        <XPButton
                          icon={XP_ICONS.restock}
                          content="Restock"
                          selected={activeTab === 'restock'}
                          onClick={() => handleTabChange('restock')}
                        />
                      </Flex.Item>
                    )}
                    {user_access >= 3 && (
                      <Flex.Item ml={1}>
                        <XPButton
                          icon={XP_ICONS.settings}
                          content="Admin"
                          selected={activeTab === 'admin'}
                          onClick={() => handleTabChange('admin')}
                        />
                      </Flex.Item>
                    )}
                    <Flex.Item ml={1}>
                      <Box
                        opacity={0.8}
                        italic
                        fontSize="11px"
                        color={WINXP_COLORS.black}
                      >
                        {reminder}
                      </Box>
                    </Flex.Item>
                  </Flex>
                </Flex.Item>
                <Flex.Item>
                  <Flex align="center">
                    {emergency_mode ? (
                      <Flex.Item mr={1}>
                        <Box
                          backgroundColor={WINXP_COLORS.red}
                          color="white"
                          p={1}
                          fontSize="14px"
                          bold
                          textAlign="center"
                        >
                          <Icon name="exclamation-triangle" mr={1} />
                          EMERGENCY MODE
                        </Box>
                      </Flex.Item>
                    ) : null}
                    <Flex.Item>
                      <XPButton
                        icon={XP_ICONS.logout}
                        content="Logout"
                        onClick={handleLogout}
                      />
                    </Flex.Item>
                  </Flex>
                </Flex.Item>
              </Flex>
            </XPWindow>
          </Flex.Item>

          {/* Main Content */}
          <Flex.Item grow={1} mt={1} style={{ overflow: 'hidden' }}>
            <Box height="100%" style={{ overflow: 'hidden' }}>
              {activeTab === 'requisition' && <PyxisRequisition />}
              {activeTab === 'logs' && <PyxisLogs />}
              {activeTab === 'restock' && <PyxisRestock />}
              {activeTab === 'admin' && <PyxisAdmin />}
            </Box>
          </Flex.Item>
        </Flex>

        {/* System Message Modal */}
        {messageModalOpen && messages && messages.length > 0 && (
          <MessageModal
            messages={messages}
            onClose={() => setMessageModalOpen(false)}
          />
        )}
      </Window.Content>
    </Window>
  );
};

// Requisition tab component
const PyxisRequisition = (props) => {
  const { act, data } = useBackend();
  const {
    categories = [],
    selected_category,
    items = [],
    cart = [],
    category_access,
    reasons = [],
    selected_reason,
    notes = '',
    patient_name = '',
    has_controlled = false,
    override_needed = false,
    access_override = false,
    override_physician = '',
    override_reason = '',
    overridden_categories = [],
    can_override = false,
    messages = [],
  } = data;

  const handleRemoveItem = (id) => {
    act('remove_from_cart', { id });
  };

  const handleClearCart = () => {
    act('clear_cart');
  };

  const [overrideOpen, setOverrideOpen] = useLocalState('override', false);
  const [overrideData, setOverrideData] = useState({
    physician: override_physician || '',
    reason: override_reason || '',
  });
  const [showMessages, setShowMessages] = useMessageHandler(messages);

  useEffect(() => {
    setOverrideData({
      physician: override_physician || '',
      reason: override_reason || '',
    });
  }, [override_physician, override_reason]);

  // Sort items alphabetically by name
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

  const containerHeight = 720;
  const categoryHeight = 100;
  const patientInfoHeight = 160; // Reduced height for patient info
  const spacing = 16; // Total spacing between components
  const mainContentHeight =
    containerHeight - categoryHeight - patientInfoHeight - spacing;

  // Check if current category is overridden
  const isCategoryOverridden =
    overridden_categories &&
    Array.isArray(overridden_categories) &&
    overridden_categories.includes(selected_category);

  const handleCategorySelect = (category) => {
    act('select_category', { category });
  };

  const handleAddToCart = (id) => {
    act('add_to_cart', { id });
  };

  const handleOverrideAccess = () => {
    setOverrideData({
      physician: override_physician || '',
      reason: override_reason || '',
    });
    setOverrideOpen(true);
  };

  const handleDeactivateOverride = () => {
    act('set_access_override', {
      override: false,
      physician: '',
      reason: '',
    });
  };

  const handleSelectReason = (reason) => {
    act('select_reason', { reason });
  };

  const handleDispense = () => {
    act('dispense');
  };

  const handleConfirmOverride = () => {
    if (overrideData.physician && overrideData.reason) {
      act('set_access_override', {
        override: true,
        physician: overrideData.physician,
        reason: overrideData.reason,
      });

      if (selected_category) {
        act('add_override_category', {
          category: selected_category,
        });
      }

      setOverrideOpen(false);
    }
  };

  return (
    <Flex direction="column" height="100%">
      {/* Categories Panel - Compact row */}
      <Flex.Item shrink={0}>
        <XPWindow title="Categories" icon="folder">
          <Flex wrap="wrap" justify="flex-start">
            {categories.map((category) => (
              <Flex.Item key={category} m={0.5} basis="auto">
                <XPButton
                  icon={getCategoryIcon(category)}
                  content={category}
                  selected={category === selected_category}
                  onClick={() => handleCategorySelect(category)}
                />
              </Flex.Item>
            ))}
          </Flex>
        </XPWindow>
      </Flex.Item>

      {/* Main Content Area */}
      <Flex.Item mt={0.5} grow={1}>
        <Flex height="100%">
          {/* Items Panel */}
          <Flex.Item basis="60%" mr={0.5}>
            <XPWindow
              title={`Items - ${selected_category || 'None Selected'}`}
              icon="pills"
            >
              <ContentBox
                style={{
                  height: mainContentHeight,
                  ...COMMON_STYLES.scrollableContent,
                }}
              >
                {/* Override Status Bar */}
                {access_override ? (
                  <XPNoticeBox icon="key" mb={1}>
                    <Flex align="center">
                      <Flex.Item grow={1}>
                        <Box color={WINXP_COLORS.black}>
                          Access override active. Authorized by:{' '}
                          <b>{override_physician}</b>
                        </Box>
                        <Box color={WINXP_COLORS.darkGrey} fontSize="11px">
                          Reason: {override_reason}
                        </Box>
                      </Flex.Item>
                      <Flex.Item>
                        <XPButton
                          icon="times"
                          content="Deactivate"
                          onClick={handleDeactivateOverride}
                        />
                      </Flex.Item>
                    </Flex>
                  </XPNoticeBox>
                ) : null}

                {/* Access denied notice */}
                {!category_access && !isCategoryOverridden ? (
                  <XPNoticeBox icon={XP_ICONS.controlled}>
                    <Flex align="center">
                      <Flex.Item grow={1}>
                        <span style={{ color: WINXP_COLORS.black }}>
                          Access to this category is restricted.
                        </span>
                      </Flex.Item>
                      {can_override ? (
                        <Flex.Item>
                          <XPButton
                            icon="key"
                            content="Override"
                            onClick={handleOverrideAccess}
                          />
                        </Flex.Item>
                      ) : null}
                    </Flex>
                  </XPNoticeBox>
                ) : null}

                {sortedItems.length === 0 ? (
                  <Box color={WINXP_COLORS.black}>
                    No items in this category.
                  </Box>
                ) : (
                  <Table>
                    <Table.Row header>
                      <Table.Cell>Item</Table.Cell>
                      <Table.Cell collapsing>Stock</Table.Cell>
                      <Table.Cell collapsing>Actions</Table.Cell>
                    </Table.Row>
                    {sortedItems.map((item) => (
                      <Table.Row key={item.id} className="candystripe">
                        <Table.Cell>
                          <Flex align="center">
                            {item.icon ? <ItemIcon icon={item.icon} /> : null}
                            <Flex.Item>
                              <Box color={WINXP_COLORS.black}>{item.name}</Box>
                            </Flex.Item>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Box color={getStockColor(item.stock)} bold>
                            {item.stock}
                          </Box>
                        </Table.Cell>
                        <Table.Cell>
                          <XPButton
                            icon="plus"
                            content="Add"
                            disabled={
                              item.stock <= 0 ||
                              (!category_access && !isCategoryOverridden) ||
                              item.has_access === false
                            }
                            tooltip={
                              !category_access && !isCategoryOverridden
                                ? 'Access restricted'
                                : item.stock <= 0
                                  ? 'Out of stock'
                                  : null
                            }
                            onClick={() => handleAddToCart(item.id)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table>
                )}
              </ContentBox>
            </XPWindow>
          </Flex.Item>

          {/* Shopping Cart - Now on the right side */}
          <Flex.Item grow={1}>
            <XPWindow title="Shopping Cart" icon={XP_ICONS.cart}>
              <ContentBox
                style={{
                  height: mainContentHeight,
                  ...COMMON_STYLES.scrollableContent,
                }}
              >
                <Flex direction="column" height="100%">
                  <Flex.Item grow={1} style={{ overflowY: 'auto' }}>
                    <Table>
                      <Table.Row header>
                        <Table.Cell>Item</Table.Cell>
                        <Table.Cell collapsing>Amount</Table.Cell>
                        <Table.Cell collapsing>Actions</Table.Cell>
                      </Table.Row>
                      {(!cart || cart.length === 0) && (
                        <Table.Row>
                          <Table.Cell colSpan="3" textAlign="center">
                            <Box color={WINXP_COLORS.black}>Cart is empty</Box>
                          </Table.Cell>
                        </Table.Row>
                      )}
                      {cart &&
                        cart.map((item) => (
                          <Table.Row key={item.id} className="candystripe">
                            <Table.Cell>
                              <Flex align="center">
                                {item.icon && <ItemIcon icon={item.icon} />}
                                <Flex.Item>
                                  <Box color={WINXP_COLORS.black}>
                                    {item.name}
                                  </Box>
                                </Flex.Item>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Box color={WINXP_COLORS.black}>
                                {item.amount}
                              </Box>
                            </Table.Cell>
                            <Table.Cell>
                              <XPButton
                                icon="minus"
                                onClick={() => handleRemoveItem(item.id)}
                              />
                            </Table.Cell>
                          </Table.Row>
                        ))}
                    </Table>
                  </Flex.Item>
                  {cart && cart.length > 0 && (
                    <Flex.Item shrink={0} mt={1} textAlign="right">
                      <XPButton
                        icon="trash"
                        content="Clear Cart"
                        color="bad"
                        onClick={handleClearCart}
                      />
                    </Flex.Item>
                  )}
                </Flex>
              </ContentBox>
            </XPWindow>
          </Flex.Item>
        </Flex>
      </Flex.Item>

      {/* Patient Information*/}
      <Flex.Item shrink={0} mt={0.5}>
        <XPWindow title="Patient Information" icon="user-injured">
          <Flex>
            {/* Left side - Patient and Notes */}
            <Flex.Item basis="30%" mr={0.5}>
              <LabeledList>
                <LabeledList.Item label="Patient Name">
                  <StyledInput
                    placeholder="Enter patient name"
                    value={patient_name}
                    onChange={(e, value) =>
                      act('set_patient_name', {
                        name: value,
                      })
                    }
                  />
                </LabeledList.Item>
                <LabeledList.Item label="Notes">
                  <StyledInput
                    placeholder="Enter notes (optional)"
                    value={notes}
                    onChange={(e, value) =>
                      act('set_notes', {
                        notes: value,
                      })
                    }
                  />
                </LabeledList.Item>
              </LabeledList>

              <Box mt={2} textAlign="center">
                <XPButton
                  width="150px"
                  icon={XP_ICONS.dispense}
                  content="Dispense"
                  disabled={
                    cart.length === 0 ||
                    (has_controlled && !selected_reason) ||
                    (has_controlled && !patient_name)
                  }
                  style={{
                    ...COMMON_STYLES.actionButtonStyle,
                  }}
                  onClick={handleDispense}
                />
              </Box>
            </Flex.Item>

            {/* Right side - Reasons */}
            <Flex.Item basis="70%" grow={1}>
              <Box color={WINXP_COLORS.black} mb={1} fontWeight="bold">
                Reason:
              </Box>
              <ContentBox
                style={{
                  maxHeight: '100px',
                  overflowY: 'auto',
                  padding: '6px',
                  backgroundColor: WINXP_COLORS.medBackground,
                }}
              >
                <Flex wrap="wrap" justify="flex-start" align="center">
                  {reasons.map((reason) => (
                    <Flex.Item key={reason} m={0.5} shrink={0}>
                      <XPButton
                        content={reason}
                        selected={reason === selected_reason}
                        onClick={() => handleSelectReason(reason)}
                        style={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      />
                    </Flex.Item>
                  ))}
                </Flex>
              </ContentBox>
            </Flex.Item>
          </Flex>
        </XPWindow>
      </Flex.Item>

      {/* Access Override Modal */}
      {overrideOpen && (
        <XPModal title="Access Override" icon={XP_ICONS.protect} width={400}>
          <Box mb={2}>
            Enter authorizing physician name and reason for access override:
          </Box>
          <LabeledList>
            <LabeledList.Item label="Physician">
              <StyledInput
                placeholder="Authorizing physician"
                value={overrideData.physician}
                onChange={(e, value) =>
                  setOverrideData({
                    ...overrideData,
                    physician: value,
                  })
                }
              />
            </LabeledList.Item>
            <LabeledList.Item label="Reason">
              <StyledInput
                placeholder="Reason for override"
                value={overrideData.reason}
                onChange={(e, value) =>
                  setOverrideData({
                    ...overrideData,
                    reason: value,
                  })
                }
              />
            </LabeledList.Item>
            <LabeledList.Item label="Category">
              <Box color={WINXP_COLORS.black}>
                {selected_category || 'None selected'}
              </Box>
            </LabeledList.Item>
          </LabeledList>
          <Box mt={2} textAlign="right">
            <XPButton
              icon="times"
              content="Cancel"
              onClick={() => setOverrideOpen(false)}
            />
            <XPButton
              icon="check"
              content="Confirm"
              ml={1}
              disabled={!overrideData.physician || !overrideData.reason}
              onClick={handleConfirmOverride}
            />
          </Box>
        </XPModal>
      )}

      {/* System Message Modal */}
      {showMessages && messages && messages.length > 0 && (
        <MessageModal
          messages={messages}
          onClose={() => {
            setShowMessages(false);
            act('acknowledge_messages');
          }}
        />
      )}
    </Flex>
  );
};

// Helper function to format log type
const formatLogType = (type) => {
  switch (type) {
    case 'login':
      return 'Login';
    case 'logout':
      return 'Logout';
    case 'dispense':
      return 'Dispensed Items';
    case 'restock':
      return 'Restock';
    case 'deposit':
      return 'Money Deposit';
    case 'override':
      return 'Access Override';
    case 'emergency_mode':
      return 'Emergency Mode';
    default:
      return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
  }
};

// Helper function to render log details
const renderLogDetails = (entry) => {
  switch (entry.type) {
    case 'login':
    case 'logout':
      return (
        <Box color={WINXP_COLORS.black}>
          {entry.type === 'login' ? 'Logged in' : 'Logged out'}
        </Box>
      );

    case 'dispense':
      return (
        <Box>
          {entry.items && entry.items.length > 0 ? (
            <Box color={WINXP_COLORS.black}>
              Items dispensed for patient: {entry.patient || 'Unknown'}
              {entry.reason && <Box>Reason: {entry.reason}</Box>}
              <Box>
                {entry.items.map((item, j) => (
                  <Box key={j}>
                    {item.amount || 1}x {item.name}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box color={WINXP_COLORS.black}>No items dispensed</Box>
          )}
        </Box>
      );

    case 'restock':
      return (
        <Box color={WINXP_COLORS.black}>
          Restocked {entry.item} ({entry.old_stock} → {entry.new_stock})
          {entry.amount ? ` - ${entry.amount} units` : ''}
          {entry.base_cost ? ` at $${entry.base_cost}/unit` : ''}
          {entry.cost ? ` - Total: $${entry.cost}` : ''}
        </Box>
      );

    case 'deposit':
      return (
        <Box color={WINXP_COLORS.black}>
          Added ${entry.amount}. New balance: ${entry.balance}
        </Box>
      );

    case 'override':
      return (
        <Box color={WINXP_COLORS.black}>
          Override for {entry.category || 'Unknown'} by{' '}
          {entry.physician || 'Unknown'}
          {entry.reason && <Box>Reason: {entry.reason}</Box>}
        </Box>
      );

    case 'emergency_mode':
      return (
        <Box color={WINXP_COLORS.black}>Emergency mode {entry.action}</Box>
      );

    default:
      if (entry.amount !== undefined) {
        return (
          <Box color={WINXP_COLORS.black}>
            Added ${entry.amount}. Balance: ${entry.balance}
          </Box>
        );
      }
      return <Box color={WINXP_COLORS.black}>No details available</Box>;
  }
};

// Log display component
const PyxisLogs = (props) => {
  const { act, data } = useBackend();
  const {
    transaction_log = [],
    access_override_log = [],
    emergency_mode_log = [],
    messages = [],
  } = data;

  const [showMessages, setShowMessages] = useMessageHandler(messages);

  // Track current log view
  const [activeLogTab, setActiveLogTab] = useLocalState(
    'logTab',
    'transactions',
  );

  const handleTabChange = (tabName) => {
    setActiveLogTab(tabName);
  };

  return (
    <>
      <XPWindow title="System Logs" icon={XP_ICONS.history}>
        <Tabs>
          <Tabs.Tab
            selected={activeLogTab === 'transactions'}
            onClick={() => handleTabChange('transactions')}
          >
            <Icon name="exchange-alt" mr={1} />
            Transactions
          </Tabs.Tab>
          <Tabs.Tab
            selected={activeLogTab === 'overrides'}
            onClick={() => handleTabChange('overrides')}
          >
            <Icon name="key" mr={1} />
            Access Overrides
          </Tabs.Tab>
          <Tabs.Tab
            selected={activeLogTab === 'emergency'}
            onClick={() => handleTabChange('emergency')}
          >
            <Icon name="exclamation-triangle" mr={1} />
            Emergency Mode
          </Tabs.Tab>
        </Tabs>

        <ContentBox
          style={{
            height: '665px',
            ...COMMON_STYLES.scrollableContent,
          }}
        >
          {activeLogTab === 'transactions' && (
            <Table>
              <Table.Row header>
                <Table.Cell>Time</Table.Cell>
                <Table.Cell>Type</Table.Cell>
                <Table.Cell>User</Table.Cell>
                <Table.Cell>Details</Table.Cell>
              </Table.Row>
              {(!transaction_log || transaction_log.length === 0) && (
                <Table.Row>
                  <Table.Cell colSpan="4" textAlign="center">
                    <Box color={WINXP_COLORS.black}>
                      No transactions recorded
                    </Box>
                  </Table.Cell>
                </Table.Row>
              )}
              {transaction_log &&
                transaction_log.map((entry, i) => (
                  <Table.Row key={i} className="candystripe">
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.timestamp || 'Unknown'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {formatLogType(entry.type)}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.user || 'Unknown'}
                        {entry.user_job && ` (${entry.user_job})`}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>{renderLogDetails(entry)}</Table.Cell>
                  </Table.Row>
                ))}
            </Table>
          )}

          {activeLogTab === 'overrides' && (
            <Table>
              <Table.Row header>
                <Table.Cell>Time</Table.Cell>
                <Table.Cell>User</Table.Cell>
                <Table.Cell>Physician</Table.Cell>
                <Table.Cell>Category</Table.Cell>
                <Table.Cell>Reason</Table.Cell>
              </Table.Row>
              {(!access_override_log || access_override_log.length === 0) && (
                <Table.Row>
                  <Table.Cell colSpan="5" textAlign="center">
                    <Box color={WINXP_COLORS.black}>
                      No access overrides recorded
                    </Box>
                  </Table.Cell>
                </Table.Row>
              )}
              {access_override_log &&
                access_override_log.map((entry, i) => (
                  <Table.Row key={i} className="candystripe">
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.timestamp || 'Unknown'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.user || 'Unknown'}
                        {entry.user_job && ` (${entry.user_job})`}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.physician || 'Unknown'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.category || 'Unknown'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.reason || 'None provided'}
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table>
          )}

          {activeLogTab === 'emergency' && (
            <Table>
              <Table.Row header>
                <Table.Cell>Time</Table.Cell>
                <Table.Cell>User</Table.Cell>
                <Table.Cell>Action</Table.Cell>
              </Table.Row>
              {(!emergency_mode_log || emergency_mode_log.length === 0) && (
                <Table.Row>
                  <Table.Cell colSpan="3" textAlign="center">
                    <Box color={WINXP_COLORS.black}>
                      No emergency mode changes recorded
                    </Box>
                  </Table.Cell>
                </Table.Row>
              )}
              {emergency_mode_log &&
                emergency_mode_log.map((entry, i) => (
                  <Table.Row key={i} className="candystripe">
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.timestamp || 'Unknown'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        {entry.user || 'Unknown'}
                        {entry.user_job && ` (${entry.user_job})`}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box color={WINXP_COLORS.black}>
                        Emergency mode {entry.action}
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table>
          )}
        </ContentBox>
      </XPWindow>

      {/* System Message Modal */}
      {showMessages && messages && messages.length > 0 && (
        <MessageModal
          messages={messages}
          onClose={() => {
            setShowMessages(false);
            act('acknowledge_messages');
          }}
        />
      )}
    </>
  );
};

// Restock component
const PyxisRestock = (props) => {
  const { act, data } = useBackend();
  const { restock_items = [], stored_money = 0, messages = [] } = data;
  const [showMessages, setShowMessages] = useMessageHandler(messages);

  const sortedRestockItems = [...restock_items].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const handleRestock = (category, id, cost) => {
    act('restock', {
      category: category,
      id: id,
      cost: cost,
    });
  };

  return (
    <>
      <XPWindow title="Restock Management" icon={XP_ICONS.restock}>
        <ContentBox mb={2} color={WINXP_COLORS.black} p={1}>
          <LabeledList>
            <LabeledList.Item label="Available Funds">
              <Box inline bold>
                ${stored_money}
              </Box>
            </LabeledList.Item>
          </LabeledList>
        </ContentBox>

        <XPNoticeBox icon="info-circle" mb={2}>
          <Box color={WINXP_COLORS.black}>
            The restock system calculates costs based on the base price per
            unit. Restocking adds up to 5 units per transaction (to a maximum
            stock level of 15). A 10% bulk discount is applied when restocking 5
            or more units.
          </Box>
        </XPNoticeBox>

        <ContentBox
          style={{
            height: '600px',
            ...COMMON_STYLES.scrollableContent,
          }}
        >
          <Table>
            <Table.Row header>
              <Table.Cell>Item</Table.Cell>
              <Table.Cell collapsing>Current Stock</Table.Cell>
              <Table.Cell collapsing>Base Cost</Table.Cell>
              <Table.Cell collapsing>Total Cost</Table.Cell>
              <Table.Cell collapsing>Action</Table.Cell>
            </Table.Row>
            {sortedRestockItems.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan="5" textAlign="center">
                  <Box color={WINXP_COLORS.black}>No items need restocking</Box>
                </Table.Cell>
              </Table.Row>
            )}
            {sortedRestockItems.map((item) => {
              // Calculate how many will be added
              const maxStock = 15;
              const toRestock = Math.min(5, maxStock - item.stock);

              return (
                <Table.Row
                  key={`${item.category}-${item.id}`}
                  className="candystripe"
                >
                  <Table.Cell>
                    <Flex align="center">
                      {item.icon && <ItemIcon icon={item.icon} />}
                      <Flex.Item>
                        <Box color={WINXP_COLORS.black}>{item.name}</Box>
                      </Flex.Item>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Box color={getStockColor(item.stock)}>{item.stock}</Box>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Box color={WINXP_COLORS.black}>${item.base_cost}/unit</Box>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Box
                      color={WINXP_COLORS.black}
                      tooltip={`Restocking ${toRestock} units at ${item.base_cost}/unit with bulk discount applied`}
                    >
                      ${item.cost}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <XPButton
                      icon="boxes"
                      content={`Restock (${toRestock})`}
                      disabled={stored_money < item.cost}
                      tooltip={
                        stored_money < item.cost
                          ? 'Insufficient funds'
                          : `Add ${toRestock} units to inventory`
                      }
                      onClick={() =>
                        handleRestock(item.category, item.id, item.cost)
                      }
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table>
        </ContentBox>
      </XPWindow>

      {/* System Message Modal */}
      {showMessages && messages && messages.length > 0 && (
        <MessageModal
          messages={messages}
          onClose={() => {
            setShowMessages(false);
            act('acknowledge_messages');
          }}
        />
      )}
    </>
  );
};

// Admin panel component
const PyxisAdmin = (props) => {
  const { act, data } = useBackend();
  const { emergency_mode, stored_money, messages = [] } = data;
  const [showMessages, setShowMessages] = useMessageHandler(messages);

  const handleToggleEmergency = () => {
    act('toggle_emergency');
  };

  return (
    <>
      <XPWindow title="Administration" icon={XP_ICONS.settings}>
        <ContentBox
          style={{
            padding: '10px',
          }}
        >
          <LabeledList>
            <LabeledList.Item label="Emergency Mode">
              <XPButton
                icon={emergency_mode ? 'lock-open' : 'lock'}
                style={{
                  backgroundColor: emergency_mode
                    ? WINXP_COLORS.red
                    : WINXP_COLORS.green,
                  ...COMMON_STYLES.standardBorder,
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  color: WINXP_COLORS.black,
                }}
                content={
                  emergency_mode
                    ? 'Deactivate Emergency Mode'
                    : 'Activate Emergency Mode'
                }
                onClick={handleToggleEmergency}
              />
              <Box mt={1} color={WINXP_COLORS.darkGrey} fontSize="11px">
                Warning: Emergency mode bypasses access restrictions
              </Box>
            </LabeledList.Item>
            <LabeledList.Item label="System Funds">
              <Box color={WINXP_COLORS.black}>${stored_money} available</Box>
            </LabeledList.Item>
          </LabeledList>
        </ContentBox>
      </XPWindow>

      {/* System Message Modal */}
      {showMessages && messages && messages.length > 0 && (
        <MessageModal
          messages={messages}
          onClose={() => {
            setShowMessages(false);
            act('acknowledge_messages');
          }}
        />
      )}
    </>
  );
};
