export const ROLES = {
  WEREWOLF: {
    id: 'WEREWOLF',
    name: 'Ma Sói',
    team: 'WEREWOLF',
    icon: '🐺',
    iconUrl: '/icons/WEREWOLF.jpg',
    color: '#ef4444',
    tagline: 'Kẻ săn mồi trong bóng tối',
    description: 'Mỗi đêm thống nhất cùng bầy sói chọn một người dân để cắn xé. Ban ngày ngụy trang để không bị phát hiện.'
  },
  SEER: {
    id: 'SEER',
    name: 'Tiên Tri',
    team: 'VILLAGE',
    icon: '🔮',
    iconUrl: '/icons/SEER.jpg',
    color: '#a855f7',
    tagline: 'Đôi mắt vạch trần bóng tối',
    description: 'Mỗi đêm soi sáng một người chơi còn sống để biết người đó thuộc Phe Sói hay Phe Dân.'
  },
  DOCTOR: {
    id: 'DOCTOR',
    name: 'Bác Sĩ',
    team: 'VILLAGE',
    icon: '💊',
    iconUrl: '/icons/DOCTOR.jpg',
    color: '#06b6d4',
    tagline: 'Vị cứu tinh thầm lặng',
    description: 'Mỗi đêm chọn một người (có thể là chính mình) để bảo vệ khỏi sự tấn công của Ma Sói.'
  },
  VILLAGER: {
    id: 'VILLAGER',
    name: 'Dân Làng',
    team: 'VILLAGE',
    icon: '👨',
    iconUrl: '/icons/VILLAGER.jpg',
    color: '#10b981',
    tagline: 'Trí tuệ của số đông',
    description: 'Không có năng lực đặc biệt ban đêm. Tìm kiếm manh mối qua thảo luận ban ngày để treo cổ Ma Sói.'
  },
  HUNTER: {
    id: 'HUNTER',
    name: 'Thợ Săn',
    team: 'VILLAGE',
    icon: '🏹',
    iconUrl: '/icons/HUNTER.jpg',
    color: '#f59e0b',
    tagline: 'Phát bắn cuối cùng',
    description: 'Khi bị hạ sát (do Ma Sói cắn đêm, thuốc độc Phù Thủy hoặc bị Dân Làng treo cổ), Thợ Săn được quyền nổ phát súng sinh tử kéo theo một kẻ khác cùng chết!'
  },
  WITCH: {
    id: 'WITCH',
    name: 'Phù Thủy',
    team: 'VILLAGE',
    icon: '🧙‍♀️',
    iconUrl: '/icons/WITCH.jpg',
    color: '#ec4899',
    tagline: 'Dược thảo sinh tử',
    description: 'Sở hữu 2 bình thuốc thần (dùng 1 lần/trận): Bình Cứu (cứu nạn nhân bị sói cắn đêm nay) và Bình Độc (đầu độc tiêu diệt 1 người bất kỳ).'
  },
  FOOL: {
    id: 'FOOL',
    name: 'Kẻ Ngốc',
    team: 'NEUTRAL',
    icon: '🃏',
    iconUrl: '/icons/FOOL.jpg',
    color: '#8b5cf6',
    tagline: 'Kẻ thao túng dư luận',
    description: 'Phe thứ ba (Độc lập). Mục tiêu duy nhất của Kẻ Ngốc là làm sao để Dân Làng nghi ngờ và bỏ phiếu TREO CỔ mình vào ban ngày. Nếu bị treo cổ, Kẻ Ngốc THẮNG NGAY LẬP TỨC!'
  },
  GHOST: {
    id: 'GHOST',
    name: 'Linh Hồn',
    team: 'GHOST',
    icon: '👻',
    iconUrl: '/icons/GHOST.jpg',
    color: '#94a3b8',
    tagline: 'Quyền năng từ cõi chết',
    description: 'Người chơi bị loại trở thành Linh Hồn. Không được nói chuyện hay bỏ phiếu ban ngày, nhưng mỗi đêm có thể tác động thực tế: 🕯️ Ám Ảnh (+1 phiếu nghi ngờ cho mục tiêu vào buổi chiều), ✨ Ban Phước (khiên giảm 1 phiếu bầu phạt cho mục tiêu), hoặc 👻 Thì Thầm (gửi điềm báo bí mật).'
  }
};

export function getRoleDeck(playerCount, selectedSpecialRoles = null) {
  // 1. Số lượng Ma Sói chuẩn theo quy mô (lên tới 16 người)
  let wolfCount = 1;
  if (playerCount >= 13) {
    wolfCount = 4;
  } else if (playerCount >= 10) {
    wolfCount = 3;
  } else if (playerCount >= 7) {
    wolfCount = 2;
  }

  const deck = [];
  for (let i = 0; i < wolfCount; i++) {
    deck.push(ROLES.WEREWOLF.id);
  }

  // 2. Phân bổ các vai trò đặc biệt
  if (Array.isArray(selectedSpecialRoles) && selectedSpecialRoles.length > 0) {
    // Luôn đảm bảo giữ lại ít nhất 2 Dân Làng (hoặc 1 nếu phòng 4 người)
    const minVillagers = playerCount <= 4 ? 1 : 2;
    const maxSpecials = Math.max(1, playerCount - wolfCount - minVillagers);
    const validSpecials = selectedSpecialRoles.filter(r => 
      ROLES[r] && r !== 'WEREWOLF' && r !== 'VILLAGER' && r !== 'GHOST'
    );
    deck.push(...validSpecials.slice(0, maxSpecials));
  } else {
    // Cấu hình chuẩn mặc định: Cân bằng hoàn hảo giữa Chức năng và Dân Làng
    if (playerCount === 4) {
      deck.push(ROLES.SEER.id);
    } else if (playerCount === 5 || playerCount === 6) {
      deck.push(ROLES.SEER.id, ROLES.DOCTOR.id);
    } else if (playerCount === 7 || playerCount === 8) {
      deck.push(ROLES.SEER.id, ROLES.DOCTOR.id, ROLES.HUNTER.id);
    } else if (playerCount <= 11) {
      deck.push(ROLES.SEER.id, ROLES.DOCTOR.id, ROLES.HUNTER.id, ROLES.WITCH.id);
    } else {
      // 12 - 16 người: Đầy đủ các vai trò đặc biệt, phần còn lại đông đảo là Dân Làng!
      deck.push(ROLES.SEER.id, ROLES.DOCTOR.id, ROLES.HUNTER.id, ROLES.WITCH.id, ROLES.FOOL.id);
    }
  }

  // 3. TẤT CẢ CÁC VỊ TRÍ CÒN LẠI LUÔN LÀ DÂN LÀNG (VILLAGER)!
  while (deck.length < playerCount) {
    deck.push(ROLES.VILLAGER.id);
  }

  return deck;
}
