import React from 'react';
import { useData } from '../context/DataContext';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  Check,
  X
} from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    deleteNotification 
  } = useData();

  const handleMarkAsRead = (id) => {
    markNotificationAsRead(id);
  };

  const handleDelete = (id) => {
    deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    notifications
      .filter(n => !n.read)
      .forEach(n => markNotificationAsRead(n._id || n.id));
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      notifications.forEach(n => deleteNotification(n._id || n.id));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="notifications">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your financial alerts</p>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount} unread</span>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn btn-secondary"
              >
                <Check size={16} />
                Mark All Read
              </button>
            )}
            <button
              onClick={handleDeleteAll}
              className="btn btn-danger"
            >
              <Trash2 size={16} />
              Delete All
            </button>
          </div>
        )}
      </div>

      <div className="notifications-container">
        {notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification._id || notification.id}
                className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.category && (
                    <span className="notification-category">
                      {notification.category}
                    </span>
                  )}
                </div>
                
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                    onClick={() => handleMarkAsRead(notification._id || notification.id)}
                      className="action-btn mark-read-btn"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id || notification.id)}
                    className="action-btn delete-btn"
                    title="Delete notification"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Bell size={48} />
            </div>
            <h3>No notifications</h3>
            <p>You're all caught up! Notifications will appear here when you have budget alerts or important updates.</p>
          </div>
        )}
      </div>

      {/* Notification Types Info */}
      <div className="notification-info">
        <h3>Notification Types</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon success">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4>Success</h4>
              <p>Positive updates and achievements</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon warning">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4>Budget Alerts</h4>
              <p>When you're approaching budget limits (80%+)</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon error">
              <XCircle size={20} />
            </div>
            <div>
              <h4>Budget Exceeded</h4>
              <p>When you've exceeded your budget limits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
