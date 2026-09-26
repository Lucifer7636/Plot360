"""
PLOT360 Backend — Notifications Router
Sections 21 & 45: Persistent notifications for service submission, workflow advances,
conflict assignments, and AI reviews.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.dependencies import get_current_user_optional, AuthenticatedUserContext

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="Get notifications")
def get_notifications(
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(Notification)

    is_admin = bool(user_ctx and user_ctx.has_role("administrator"))
    is_auditor = bool(user_ctx and user_ctx.has_role("auditor"))
    is_officer = bool(user_ctx and (is_admin or is_auditor or any(
        r in user_ctx.roles for r in [
            "revenue_officer", "registration_officer", "planning_officer", "municipal_officer", "tax_officer"
        ]
    )))

    if not is_officer:
        # Citizens must NOT receive internal officer or system diagnostics (Part 43)
        if user_ctx:
            q = q.filter(
                (Notification.user_id == user_ctx.id) |
                ((Notification.user_id == None) & (Notification.notification_type.in_(["SERVICE_REQUEST", "CITIZEN", "INFO"])))
            )
        else:
            q = q.filter(
                (Notification.user_id == None) & (Notification.notification_type.in_(["SERVICE_REQUEST", "CITIZEN", "INFO"]))
            )
        q = q.filter(~Notification.notification_type.in_(["SYSTEM", "CONFLICT", "AI_ALERT", "VERIFICATION", "ADMIN"]))
    else:
        if user_ctx and not (is_admin or is_auditor):
            # Targeted officer notifications
            q = q.filter((Notification.user_id == user_ctx.id) | (Notification.user_id == None))

    notifications = q.order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": str(n.id),
            "title": n.title,
            "desc": n.message,
            "message": n.message,
            "notification_type": n.notification_type,
            "priority": n.priority,
            "unread": not n.is_read,
            "time": n.created_at.strftime("%d %b, %H:%M") if n.created_at else "Just now",
            "related_ulpin": n.related_ulpin
        }
        for n in notifications
    ]


@router.patch("/{notification_id}/read", summary="Mark notification as read")
def mark_read(
    notification_id: int = Path(..., description="Notification ID"),
    db: Session = Depends(get_db)
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"success": True, "id": n.id, "is_read": True}


@router.post("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(Notification)
    if user_ctx:
        q = q.filter((Notification.user_id == user_ctx.id) | (Notification.user_id == None))
    q.update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"success": True, "message": "All notifications marked as read"}
