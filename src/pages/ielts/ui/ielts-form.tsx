import { Form, Input } from 'antd'

const IeltsForm = () => {
	return (
		<Form.Item
			name='title'
			label='Test nomi'
			rules={[{ required: true, message: 'Test nomini kiriting' }]}>
			<Input
				placeholder='Test nomini kiriting'
				size='middle'
			/>
		</Form.Item>
	)
}

export default IeltsForm
